import { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit, RefreshCw, AlertTriangle, CheckCircle,
  TrendingDown, ShoppingCart, Layers, Database,
  FlaskConical, Loader2,
} from 'lucide-react';
import {
  aiApi,
  type StockAnalysisResponse,
  type ReorderResponse,
  type TrainResponse,
  type PartPrediction,
} from '../../shared/api/ai.api';
import { getAuthUser } from '../auth/session';

// ─── Константы ────────────────────────────────────────────────────────────────

type Tab = 'analysis' | 'reorder' | 'train';

const URGENCY_LABEL: Record<string, string> = {
  critical: 'КРИТИЧНО',
  warning:  'ВНИМАНИЕ',
  ok:       'НОРМА',
};

const URGENCY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  warning:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  ok:       'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
};

const URGENCY_BAR: Record<string, string> = {
  critical: 'bg-red-500',
  warning:  'bg-amber-500',
  ok:       'bg-emerald-500',
};

// ─── Пояснение для пользователя ───────────────────────────────────────────────

function explanation(p: PartPrediction): string {
  if (p.urgency === 'critical') {
    if (p.days_until_stockout !== null && p.days_until_stockout <= 7) {
      return `Запас заканчивается через ${p.days_until_stockout} дн. — срочный заказ`;
    }
    return 'Запас на нуле или расход критический — требуется срочный заказ';
  }
  if (p.urgency === 'warning') {
    if (p.days_until_stockout !== null) {
      return `Осталось ~${p.days_until_stockout} дн. — рекомендуется пополнить`;
    }
    return 'Запас ниже минимума — рекомендуется пополнить';
  }
  if (p.days_until_stockout !== null) {
    return `Запас в норме (~${p.days_until_stockout} дн.)`;
  }
  return 'Запас в норме, расхода нет';
}

// ─── Компоненты ───────────────────────────────────────────────────────────────

function UrgencyBadge({ urgency }: { urgency: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${URGENCY_BADGE[urgency] ?? 'bg-slate-700 text-slate-300'}`}>
      {URGENCY_LABEL[urgency] ?? urgency}
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const urgency = value >= 80 ? 'ok' : value >= 60 ? 'warning' : 'critical';
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${URGENCY_BAR[urgency]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right">{value}%</span>
    </div>
  );
}

// ─── Страница ─────────────────────────────────────────────────────────────────

export function AiPage() {
  const user = getAuthUser();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState<Tab>('analysis');

  // Состояния для каждой вкладки
  const [analysis, setAnalysis] = useState<StockAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [reorder, setReorder] = useState<ReorderResponse | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const [trainResult, setTrainResult] = useState<TrainResponse | null>(null);
  const [trainLoading, setTrainLoading] = useState(false);
  const [trainError, setTrainError] = useState<string | null>(null);

  // ─── Загрузка данных ────────────────────────────────────────────────────────

  const loadAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    try {
      setAnalysis(await aiApi.getAnalysis());
    } catch (e) {
      setAnalysisError((e as Error).message);
    } finally {
      setAnalysisLoading(false);
    }
  }, []);

  const loadReorder = useCallback(async () => {
    setReorderLoading(true);
    setReorderError(null);
    try {
      setReorder(await aiApi.getReorder());
    } catch (e) {
      setReorderError((e as Error).message);
    } finally {
      setReorderLoading(false);
    }
  }, []);

  const runTrain = async () => {
    setTrainLoading(true);
    setTrainError(null);
    setTrainResult(null);
    try {
      setTrainResult(await aiApi.train());
    } catch (e) {
      setTrainError((e as Error).message);
    } finally {
      setTrainLoading(false);
    }
  };

  useEffect(() => { loadAnalysis(); }, [loadAnalysis]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'analysis', label: 'Анализ склада' },
    { id: 'reorder',  label: 'Рекомендации к закупке' },
    ...(isAdmin ? [{ id: 'train' as Tab, label: 'Обучение модели', adminOnly: true }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-600/20 rounded-xl">
          <BrainCircuit size={22} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">AI-анализ склада</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Нейросеть MLP · 6 признаков · 3 класса (ok / warning / critical)
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === 'reorder' && !reorder && !reorderLoading) loadReorder();
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Вкладка: Анализ склада ─────────────────────────────────────────── */}
      {tab === 'analysis' && (
        <div className="space-y-4">
          {/* Stats */}
          {analysis && (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Всего позиций',  value: analysis.total_parts,    color: 'text-blue-400',    bg: 'bg-blue-600/10' },
                { label: 'Критично',       value: analysis.critical_parts, color: 'text-red-400',     bg: 'bg-red-600/10'  },
                { label: 'Внимание',       value: analysis.warning_parts,  color: 'text-amber-400',   bg: 'bg-amber-600/10'},
                { label: 'В норме',        value: analysis.ok_parts,       color: 'text-emerald-400', bg: 'bg-emerald-600/10'},
              ].map(({ label, value, color, bg }) => (
                <div key={label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className={`inline-flex p-2 rounded-lg mb-2 ${bg}`}>
                    <TrendingDown size={16} className={color} />
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Результат предсказания нейросети по каждой запчасти на складе
            </p>
            <button
              onClick={loadAnalysis}
              disabled={analysisLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {analysisLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <RefreshCw size={14} />
              }
              Обновить
            </button>
          </div>

          {/* Error */}
          {analysisError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {analysisError.includes('не обучена') || analysisError.includes('425')
                ? 'Нейросеть ещё не обучена. Перейдите во вкладку «Обучение модели» и запустите обучение.'
                : analysisError
              }
            </div>
          )}

          {/* Loading skeleton */}
          {analysisLoading && !analysis && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              Нейросеть анализирует склад…
            </div>
          )}

          {/* Table */}
          {analysis && analysis.parts.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Запчасть</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Остаток / Мин.</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Расход/день</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Дней до нуля</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Уровень</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Уверенность</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Пояснение</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.parts.map(p => (
                    <tr
                      key={p.part_id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{p.part_name}</p>
                        <p className="text-slate-500 text-xs">{p.article}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={p.current_stock <= p.min_stock ? 'text-red-400 font-medium' : 'text-slate-300'}>
                          {p.current_stock}
                        </span>
                        <span className="text-slate-600"> / {p.min_stock}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {p.daily_rate > 0 ? p.daily_rate.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {p.days_until_stockout !== null
                          ? <span className={p.days_until_stockout <= 7 ? 'text-red-400 font-semibold' : 'text-slate-300'}>{p.days_until_stockout}</span>
                          : <span className="text-slate-600">∞</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <UrgencyBadge urgency={p.urgency} />
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBar value={p.confidence} />
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px]">
                        {explanation(p)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {analysis && analysis.parts.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              <CheckCircle size={32} className="mx-auto mb-2 text-emerald-500" />
              На складе нет запчастей для анализа
            </div>
          )}
        </div>
      )}

      {/* ─── Вкладка: Рекомендации к закупке ───────────────────────────────── */}
      {tab === 'reorder' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {reorder && (
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-blue-400" />
                  <span className="text-white font-semibold">{reorder.total_items}</span>
                  <span className="text-slate-500 text-sm">позиций к заказу</span>
                </div>
                {reorder.total_estimated_cost && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2">
                    <span className="text-slate-500 text-sm">Сумма ~</span>
                    <span className="text-white font-semibold">
                      {reorder.total_estimated_cost.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={loadReorder}
              disabled={reorderLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg transition-colors disabled:opacity-50"
            >
              {reorderLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <RefreshCw size={14} />
              }
              Обновить
            </button>
          </div>

          {reorderError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {reorderError}
            </div>
          )}

          {reorderLoading && !reorder && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
              <Loader2 size={24} className="animate-spin mx-auto mb-2" />
              Формирование рекомендаций…
            </div>
          )}

          {reorder && reorder.items.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
              <CheckCircle size={36} className="mx-auto mb-3 text-emerald-500" />
              <p className="text-white font-medium">Все запасы в норме</p>
              <p className="text-slate-500 text-sm mt-1">Закупка не требуется</p>
            </div>
          )}

          {reorder && reorder.items.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Запчасть</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Текущий остаток</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Рекомендовано (шт.)</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Стоимость</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Уровень</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Уверенность</th>
                  </tr>
                </thead>
                <tbody>
                  {reorder.items.map(item => (
                    <tr
                      key={item.part_id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{item.part_name}</p>
                        <p className="text-slate-500 text-xs">{item.article}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-400 font-medium">{item.current_stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-white font-semibold">{item.recommended_order_qty}</span>
                        <span className="text-slate-500 text-xs ml-1">шт.</span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {item.estimated_cost !== null
                          ? `${item.estimated_cost.toLocaleString('ru-RU')} ₽`
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3">
                        <UrgencyBadge urgency={item.urgency} />
                      </td>
                      <td className="px-4 py-3">
                        <ConfidenceBar value={item.confidence} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Вкладка: Обучение модели (только admin) ────────────────────────── */}
      {tab === 'train' && isAdmin && (
        <div className="space-y-5">
          {/* Карточка с описанием модели */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers size={16} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Архитектура нейросети</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <InfoRow label="Тип" value="MLPClassifier (многослойный персептрон)" />
                <InfoRow label="Входной слой" value="6 признаков" />
                <InfoRow label="Скрытые слои" value="128 → 64 → 32 нейронов (ReLU)" />
                <InfoRow label="Выходной слой" value="3 класса: ok / warning / critical" />
                <InfoRow label="Оптимизатор" value="Adam" />
                <InfoRow label="Нормализация" value="StandardScaler" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Database size={14} className="text-slate-400" />
                  <span className="text-slate-400 text-xs font-medium">Данные для обучения</span>
                </div>
                <InfoRow label="Синтетические" value="2 000 примеров (5 паттернов)" />
                <InfoRow label="Реальные" value="Из таблицы stock_operations (БД)" />
                <InfoRow label="Признаки" value="current_stock, min_stock, daily_rate, stock_ratio, days_until_stockout, monthly_consumption" />
                <InfoRow label="Файлы модели" value="model.pkl + scaler.pkl" />
              </div>
            </div>
          </div>

          {/* Кнопка обучения */}
          <div className="flex items-center gap-4">
            <button
              onClick={runTrain}
              disabled={trainLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {trainLoading
                ? <><Loader2 size={16} className="animate-spin" /> Обучение…</>
                : <><FlaskConical size={16} /> Запустить обучение</>
              }
            </button>
            {trainLoading && (
              <span className="text-slate-500 text-sm">
                Обучение нейросети на 2000+ примерах, подождите…
              </span>
            )}
          </div>

          {trainError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {trainError}
            </div>
          )}

          {/* Результаты обучения */}
          {trainResult && (
            <div className="space-y-4">
              {/* Итоговые метрики */}
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label="Общая точность"
                  value={`${trainResult.accuracy}%`}
                  sub="accuracy на тестовой выборке (20%)"
                  highlight
                />
                <MetricCard
                  label="Итераций обучения"
                  value={String(trainResult.iterations)}
                  sub="эпох до сходимости"
                />
                <MetricCard
                  label="Обучающих примеров"
                  value={String(trainResult.samples_total)}
                  sub={`из них реальных: ${trainResult.real_samples}`}
                />
              </div>

              {/* Метрики по классам */}
              {trainResult.metrics_by_class && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-sm font-medium text-white">Метрики по классам</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Precision — точность · Recall — полнота · F1 — гармоническое среднее
                    </p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Класс</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Precision</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Recall</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">F1-score</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Поддержка</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(['ok', 'warning', 'critical'] as const).map(cls => {
                        const m = trainResult.metrics_by_class![cls];
                        if (!m) return null;
                        return (
                          <tr key={cls} className="border-b border-slate-800/60">
                            <td className="px-4 py-3">
                              <UrgencyBadge urgency={cls} />
                            </td>
                            <td className="px-4 py-3">
                              <MetricValue value={m.precision} />
                            </td>
                            <td className="px-4 py-3">
                              <MetricValue value={m.recall} />
                            </td>
                            <td className="px-4 py-3">
                              <MetricValue value={m.f1_score} />
                            </td>
                            <td className="px-4 py-3 text-slate-400">{m.support}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle size={16} />
                Модель обучена и сохранена в model.pkl + scaler.pkl
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Мелкие вспомогательные компоненты ───────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-slate-300 text-sm">{value}</span>
    </div>
  );
}

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-blue-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
    </div>
  );
}

function MetricValue({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? 'text-emerald-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <span className={`font-medium ${color}`}>{value.toFixed(3)}</span>
      <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${pct >= 85 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

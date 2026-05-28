import { createBrowserRouter } from "react-router";
import { Layout } from "./layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { OrdersPage } from "./pages/OrdersPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { PartsPage } from "./pages/PartsPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { UsersPage } from "./pages/UsersPage";
import { AiPage } from "./pages/AiPage";
import { LogPage } from "./pages/LogPage";
import { redirect } from "react-router";
import { getAuthUser } from "./auth/session";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: LoginPage,
    loader: () => {
      if (getAuthUser()) return redirect("/");
      return null;
    },
  },
  {
    path: "/",
    Component: Layout,
    loader: () => {
      if (!getAuthUser()) return redirect("/login");
      return null;
    },
    children: [
      { index: true, Component: DashboardPage },
      { path: "orders", Component: OrdersPage },
      { path: "vehicles", Component: VehiclesPage },
      { path: "warehouse", Component: PartsPage },
      { path: "profile", Component: ProfilePage },
      {
        path: "users",
        Component: UsersPage,
        loader: () => {
          const user = getAuthUser();
          if (!user) return redirect("/login");
          if (user.role !== "admin") return redirect("/");
          return null;
        },
      },
      {
        path: "logs",
        Component: LogPage,
        loader: () => {
          const user = getAuthUser();
          if (!user) return redirect("/login");
          if (user.role !== "admin") return redirect("/");
          return null;
        },
      },
      {
        path: "ai",
        Component: AiPage,
        loader: () => {
          const user = getAuthUser();
          if (!user) return redirect("/login");
          if (user.role === "mechanic") return redirect("/");
          return null;
        },
      },
    ],
  },
]);

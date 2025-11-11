import Home from "../components/Pages/Home";
import Login from "../components/Pages/auth/Login";
import Signup from "../components/Pages/auth/Signup";
import SignupSuccess from "../components/Pages/auth/SignupSuccess";
import SignupCancel from "../components/Pages/auth/SignupCancel";
import HelpCenter from "../components/Pages/HelpCenter";
import ServiceDetail from "../components/Pages/ServiceDetail";
import UserProfile from "../components/Pages/Profile";
import ProfessionalProfile from "../components/customer/ProfessionalProfile";
import ProfessionalBookingPage from "../components/Pages/booking/ProfessionalBookingPage";
import SettingsPage from "../components/Pages/user/SettingsPage";

import ProfessionalHome from "../views/professionalView/ProfessionalHome";
import MyServices from "../views/professionalView/MyServices";
import AddServicePage from "../views/professionalView/AddServicePage";
import ProfessionalRequests from "../views/professionalView/ProfessionalRequests";
import ProfessionalAvailability from "../views/professionalView/ProfessionalAvailability";
import ProfessionalCustomers from "../views/professionalView/ProfessionalCustomers";
import StripeConnectPage from "../views/professionalView/StripeConnectPage";

export const customerRouteConfig = [
  { path: "/", component: Home },
  { path: "/profile/:userId", component: UserProfile },
  { path: "/login", component: Login },
  { path: "/signup", component: Signup },
  { path: "/signup/success", component: SignupSuccess },
  { path: "/signup/cancel", component: SignupCancel },
  { path: "/service/:id", component: ServiceDetail },
  { path: "/help", component: HelpCenter },
  { path: "/settings", component: SettingsPage },
  { path: "/professional/:id", component: ProfessionalProfile },
  { path: "/professional/:id/book", component: ProfessionalBookingPage },
];

export const professionalRouteConfig = [
  { path: "/add-service", component: AddServicePage },
  { path: "/professional-home", component: ProfessionalHome },
  { path: "/customers", component: ProfessionalCustomers },
  { path: "/customers/:customerId", component: ProfessionalCustomers },
  { path: "/Services", component: MyServices },
  { path: "/availability", component: ProfessionalAvailability },
  { path: "/bookings", component: ProfessionalRequests },
  { path: "/payments/connect", component: StripeConnectPage },
];


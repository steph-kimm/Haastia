import Home from "../components/Pages/Home";
import Login from "../components/Pages/auth/Login";
import Signup from "../components/Pages/auth/Signup";
import SignupSuccess from "../components/Pages/auth/SignupSuccess";
import SignupCancel from "../components/Pages/auth/SignupCancel";
import ForgotPassword from "../components/Pages/auth/ForgotPassword";
import PasswordRecoveryRequest from "../components/Pages/auth/PasswordRecoveryRequest";
import ResetPassword from "../components/Pages/auth/ResetPassword";
import HelpCenter from "../components/Pages/HelpCenter";
import ServiceDetail from "../components/Pages/ServiceDetail";
import UserProfile from "../components/Pages/Profile";
import ProfessionalProfile from "../components/customer/ProfessionalProfile";
import ProfessionalBookingPage from "../components/Pages/booking/ProfessionalBookingPage";
import BookingManagePage from "../components/Pages/booking/BookingManagePage";
import HelpPage from "../components/Pages/HelpPage";

import ProfessionalHome from "../views/professionalView/ProfessionalHome";
import MyServices from "../views/professionalView/MyServices";
import AddServicePage from "../views/professionalView/AddServicePage";
import ProfessionalRequests from "../views/professionalView/ProfessionalRequests";
import AppointmentDetails from "../views/professionalView/AppointmentDetails";
import ProfessionalAvailability from "../views/professionalView/ProfessionalAvailability";
import ProfessionalCustomers from "../views/professionalView/ProfessionalCustomers";
import StripeConnectPage from "../views/professionalView/StripeConnectPage";
import ProfessionalOnboarding from "../views/professionalView/ProfessionalOnboarding";
import ProfessionalSettings from "../views/professionalView/ProfessionalSettings";
import ProfessionalSettingsOverview from "../views/professionalView/ProfessionalSettingsOverview";

export const customerRouteConfig = [
  { path: "/", component: Home },
  { path: "/profile/:userId", component: UserProfile },
  { path: "/login", component: Login },
  { path: "/signup", component: Signup },
  { path: "/signup/success", component: SignupSuccess },
  { path: "/signup/cancel", component: SignupCancel },
  { path: "/password/forgot", component: ForgotPassword },
  { path: "/password/recovery", component: PasswordRecoveryRequest },
  { path: "/password/reset", component: ResetPassword },
  { path: "/service/:id", component: ServiceDetail },
  { path: "/help", component: HelpCenter },
  { path: "/professional/:id", component: ProfessionalProfile },
  { path: "/professional/:id/book", component: ProfessionalBookingPage },
  { path: "/bookings/manage/:token", component: BookingManagePage },
  { path: "/help", component: HelpPage },
];

export const professionalRouteConfig = [
  { path: "/onboarding", component: ProfessionalOnboarding },
  { path: "/profile-guidelines", component: ProfessionalSettings },
  { path: "/add-service", component: AddServicePage },
  { path: "/calendar", component: ProfessionalHome },
  { path: "/customers", component: ProfessionalCustomers },
  { path: "/customers/:customerId", component: ProfessionalCustomers },
  { path: "/Services", component: MyServices },
  { path: "/availability", component: ProfessionalAvailability },
  { path: "/bookings", component: ProfessionalRequests },
  { path: "/bookings/:bookingId", component: AppointmentDetails },
  { path: "/payments/connect", component: StripeConnectPage },
  { path: "/pro/settings", component: ProfessionalSettingsOverview },
];

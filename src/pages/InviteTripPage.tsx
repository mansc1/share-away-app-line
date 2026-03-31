import { useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import JoinTripPage from "./JoinTripPage";

const InviteTripPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (!token) return;
    if (location.pathname.startsWith("/join/")) {
      navigate(`/invite/${token}`, { replace: true });
    }
  }, [location.pathname, navigate, token]);

  return <JoinTripPage />;
};

export default InviteTripPage;

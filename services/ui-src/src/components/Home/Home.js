import React, { useState, useEffect } from "react";
import { useAppContext } from "../../libs/contextLib";
import "./Home.scss";
import HomeState from "../HomeState/HomeState";
import HomeBus from "../HomeBus/HomeBus";
import HomeAdmin from "../HomeAdmin/HomeAdmin";
import Unauthorized from "../Unauthorized/Unauthorized";

export default function Home({ user }) {
  const { isAuthenticated } = useAppContext();
  /* eslint-disable no-unused-vars */
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(isAuthenticated === false);
  }, [isAuthenticated]);

  const renderLander = () => {
    let content;

    switch (user.attributes["app-role"]) {
      case "state":
        content = <HomeState />;
        break;
      case "business":
        content = <HomeBus />;
        break;
      case "admin":
        content = <HomeAdmin />;
        break;
      default:
        content = <Unauthorized />;
        break;
    }
    return content;
  };

  return (
    <div className="Home react-transition swipe-right" data-testid="Home">
      {renderLander()}
    </div>
  );
}

Home.propTypes = {};
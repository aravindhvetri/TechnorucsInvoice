import * as React from "react";
import styles from "./AppLoader.module.scss";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const logo: any = require("../../../assets/images/technorucslogo.png");

//require("../../../assets/images/technorucslogo.png");

const AppLoader: React.FC = () => {
  return (
    <div className={styles.ApploaderWrapper}>
      <img src={logo} alt="App logo" />
    </div>
  );
};

export default AppLoader;

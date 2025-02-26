import React, { useEffect, useState } from "react";
import RootLayout from "../layout/rootLayout";
import * as SplashScreen from "expo-splash-screen";
import CustomSplashScreen from "../components/SplashScreen";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

export default function AppLayout() {
  const [isSplashScreenHidden, setIsSplashScreenHidden] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      setTimeout(async () => {
        await SplashScreen.hideAsync();
        setIsSplashScreenHidden(true);
      }, 4000);
    }
    prepareApp();
  }, []);

  return (
    <>
      {!isSplashScreenHidden ? (
        <CustomSplashScreen />
      ) : (
        <>
          <RootLayout />
          <Toast />
        </>
      )}
    </>
  );
}

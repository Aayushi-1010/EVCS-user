import React, { useEffect, useState } from "react";
import RootLayout from "../layout/rootLayout";
import * as SplashScreen from "expo-splash-screen";
import CustomSplashScreen from "../components/SplashScreen";
import Toast from "react-native-toast-message";
import { StripeProvider } from "@stripe/stripe-react-native";

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
          <StripeProvider publishableKey="pk_test_51QuoliR9Xrh03gulBDDVxQb6wwrSdB8GNDaoeWxJN8SRM5CFxPDtqAYuBAANZfPgWafgq12yJRUAhR85SqFXENgM00whHP7x2g"> 
          <RootLayout />
          <Toast />
          </StripeProvider>
        </>
      )}
    </>
  );
}

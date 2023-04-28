import React, { useEffect } from "react";
import { persistLogin } from "../services/auth";
import { useMutation } from "@tanstack/react-query";
import { useAppContext } from "../context/appContext";
import { api } from "../services/makeRequest";
const usePersistLogin = () => {
  const { authDetails, setAuthDetails, setIsLoadingAuth } = useAppContext();

  const { mutate: persistLoginMutation } = useMutation({
    mutationFn: (accessToken) => {
      return persistLogin(accessToken);
    },
    onSuccess: (res) => {
      setAuthDetails({ ...res.data.userWithDocuments });
      const accessToken = res.headers.authorization.split(" ")[1];
      localStorage.setItem("accessToken", accessToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      setIsLoadingAuth(false); // Set loading state to false after checking
    },
  });
  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");

    if (Object.keys(authDetails).length === 0 && accessToken) {
      persistLoginMutation(accessToken);
    }
  }, []);
};

export default usePersistLogin;
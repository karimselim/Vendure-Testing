type resetPasswordSuccess = {
  __typename: "CurrentUser";
  id: string;
  identifier: string;
};

type resetPasswordError = {
  __typename: string;
  errorCode: string;
  message: string;
};

export type graphResetPasswordResponse = {
  data?: {
    resetPassword: resetPasswordSuccess | resetPasswordError;
  };
  errors?: {
    message: string;
  }[];
};

import { card_medium } from "../../assets/styles/cards";

export const cardStyle = {
  ...card_medium,
  ...{
    display: "flex",
    justifyContent: "center",
    flexDirection: "column",
    gap: 1,
    height: "auto",
  },
};

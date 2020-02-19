import Biscoint from "biscoint-api-node";
import { handleMessage, handleError, percent } from "./utils";
import config from "./config.js";

let { amount, initialSell, minProfitPercent, intervalMs, test } = config;

const bc = new Biscoint({
  apiKey: config.key,
  apiSecret: config.secret
});

let sellOffer = null,
  buyOffer = null,
  lastTrade = 0;

setInterval(async () => {
  try {
    sellOffer = await bc.offer({
      amount,
      isQuote: false,
      op: "sell"
    });
    buyOffer = await bc.offer({
      amount,
      isQuote: false,
      op: "buy"
    });
  } catch (error) {
    handleError("Error on get offer", error);
  }
  if (
    sellOffer != null &&
    buyOffer != null &&
    Date.now() - lastTrade >= intervalMs
  ) {
    const profit = percent(buyOffer.efPrice, sellOffer.efPrice);
    handleMessage(`Profit found: ${profit.toFixed(3)}%`);
    if (minProfitPercent <= profit && !test) {
      if (initialSell) {
        try {
          let resSell = await bc.confirmOffer({ offerId: sellOffer.offerId });
          handleMessage("Success on sell");
          /* buy */
          try {
            let resBuy = await bc.confirmOffer({
              offerId: buyOffer.offerId
            });
            handleMessage("Success on rebuy");
            lastTrade = Date.now();
          } catch (error) {
            handleError("Error on rebuy", error);
          }
          /* buy */
        } catch (error) {
          handleError("Error on sell", error);
          if (error.error === "Insufficient funds") {
            initialSell = !initialSell;
            handleMessage("Switched to first buy");
          }
        }
      } else {
        try {
          let resBuy = await bc.confirmOffer({ offerId: buyOffer.offerId });
          handleMessage("Success on buy");
          /* sell */
          try {
            let resSell = await bc.confirmOffer({ offerId: sellOffer.offerId });
            handleMessage("Success on sell");
            lastTrade = Date.now();
            handleMessage(`Success, profit: + ${profit.toFixed(3)}%`);
          } catch (error) {
            handleError("Error on sell", error);
          }
          /* sell */
        } catch (error) {
          handleError("Error on buy", error);
          if (error.error === "Insufficient funds") {
            initialSell = !initialSell;
            handleMessage("Switched to first sell");
          }
        }
      }
    }
  }
}, intervalMs);
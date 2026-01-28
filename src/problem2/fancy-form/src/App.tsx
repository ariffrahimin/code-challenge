import { useState, useEffect } from "react";
import "./App.css";
import {
  Loop,
  ExpandMore,
  SwapVert,
  TrendingUp,
  AccessTime,
  Info,
} from "@mui/icons-material";
interface Token {
  symbol: string;
  name: string;
  price: number;
  image: string;
}

interface PriceData {
  currency: string;
  price: string;
}

function App() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
  const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchFrom, setSearchFrom] = useState<string>("");
  const [searchTo, setSearchTo] = useState<string>("");
  const [swapping, setSwapping] = useState<boolean>(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch(
        "https://interview.switcheo.com/prices.json",
      );
      const data: PriceData[] = await response.json();

      const uniqueTokens: Token[] = [];
      const seen = new Set<string>();

      data.forEach((item) => {
        if (item.price && !seen.has(item.currency)) {
          seen.add(item.currency);
          uniqueTokens.push({
            symbol: item.currency,
            name: item.currency,
            price: parseFloat(item.price),
            image: `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${item.currency}.svg`,
          });
        }
      });

      setTokens(uniqueTokens.sort((a, b) => a.symbol.localeCompare(b.symbol)));

      if (uniqueTokens.length >= 2) {
        setFromToken(uniqueTokens[0]);
        setToToken(uniqueTokens[1]);
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to load tokens");
      setLoading(false);
    }
  };

  const handleFromAmountChange = (value: string): void => {
    setFromAmount(value);
    if (value && fromToken && toToken) {
      const calculated = (parseFloat(value) * fromToken.price) / toToken.price;
      setToAmount(calculated.toFixed(6));
    } else {
      setToAmount("");
    }
  };

  const handleToAmountChange = (value: string): void => {
    setToAmount(value);
    if (value && fromToken && toToken) {
      const calculated = (parseFloat(value) * toToken.price) / fromToken.price;
      setFromAmount(calculated.toFixed(6));
    } else {
      setFromAmount("");
    }
  };

  const handleSwapTokens = (): void => {
    setSwapping(true);
    setTimeout(() => {
      const tempToken = fromToken;
      const tempAmount = fromAmount;

      setFromToken(toToken);
      setToToken(tempToken);
      setFromAmount(toAmount);
      setToAmount(tempAmount);
      setSwapping(false);
    }, 300);
  };

  const exchangeRate: string =
    fromToken && toToken ? (fromToken.price / toToken.price).toFixed(6) : "0";

  const filteredFromTokens: Token[] = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(searchFrom.toLowerCase()) ||
      t.name.toLowerCase().includes(searchFrom.toLowerCase()),
  );

  const filteredToTokens: Token[] = tokens.filter(
    (t) =>
      t.symbol.toLowerCase().includes(searchTo.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTo.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="swap-container">
        <div className="loading-screen">
          <Loop className="loading-spinner" />
          <p className="loading-text">Loading currencies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="swap-container">
        <div className="swap-wrapper">
          {/* Header */}
          <div className="swap-header">
            <h1 className="swap-title">Currency Swap</h1>
            <p className="swap-subtitle">Fast, secure, and transparent</p>
          </div>

          {/* Main swap card */}
          <div className="swap-card">
            {error && (
              <div className="error-message">
                <AlertCircle className="error-icon" />
                <p className="error-text">{error}</p>
              </div>
            )}

            <div className="swap-content">
              {/* You send section */}
              <div className="input-section">
                <label className="input-label">You send</label>
                <div
                  className={`input-wrapper ${showFromDropdown ? "focused" : ""}`}
                >
                  <div className="input-row">
                    <input
                      type="number"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="amount-input"
                    />

                    <div className="currency-selector">
                      <button
                        onClick={() => setShowFromDropdown(!showFromDropdown)}
                        className="currency-button"
                      >
                        {fromToken ? (
                          <>
                            <img
                              src={fromToken.image}
                              alt={fromToken.symbol}
                              className="currency-icon"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="%2314b8a6"/></svg>')
                              }
                            />
                            <span className="currency-symbol">
                              {fromToken.symbol}
                            </span>
                          </>
                        ) : (
                          <span className="currency-placeholder">Select</span>
                        )}
                        <ExpandMore className="chevron-icon" />
                      </button>

                      {showFromDropdown && (
                        <div className="dropdown-menu">
                          <div className="dropdown-search">
                            <input
                              type="text"
                              value={searchFrom}
                              onChange={(e) => setSearchFrom(e.target.value)}
                              placeholder="Search currencies..."
                              className="search-input"
                            />
                          </div>
                          <div className="dropdown-list">
                            {filteredFromTokens.map((token) => (
                              <button
                                key={token.symbol}
                                onClick={() => {
                                  setFromToken(token);
                                  setShowFromDropdown(false);
                                  setSearchFrom("");
                                  if (fromAmount)
                                    handleFromAmountChange(fromAmount);
                                }}
                                className="dropdown-item"
                              >
                                <div className="dropdown-item-left">
                                  <img
                                    src={token.image}
                                    alt={token.symbol}
                                    className="dropdown-icon"
                                    onError={(e) =>
                                      ((e.target as HTMLImageElement).src =
                                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="%2314b8a6"/></svg>')
                                    }
                                  />
                                  <div className="dropdown-item-info">
                                    <div className="dropdown-item-symbol">
                                      {token.symbol}
                                    </div>
                                    <div className="dropdown-item-name">
                                      {token.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="dropdown-item-price">
                                  ${token.price.toFixed(4)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {fromToken && fromAmount && (
                  <div className="usd-equivalent">
                    ≈ ${(parseFloat(fromAmount) * fromToken.price).toFixed(2)}{" "}
                    USD
                  </div>
                )}
              </div>

              {/* Swap button */}
              <div className="swap-button-container">
                <button
                  onClick={handleSwapTokens}
                  disabled={swapping}
                  className={`swap-toggle-button ${swapping ? "spinning" : ""}`}
                >
                  <SwapVert className="swap-icon" />
                </button>
              </div>

              {/* You receive section */}
              <div className="input-section">
                <label className="input-label">You receive</label>
                <div
                  className={`input-wrapper ${showToDropdown ? "focused" : ""}`}
                >
                  <div className="input-row">
                    <input
                      type="number"
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="amount-input"
                    />

                    <div className="currency-selector">
                      <button
                        onClick={() => setShowToDropdown(!showToDropdown)}
                        className="currency-button"
                      >
                        {toToken ? (
                          <>
                            <img
                              src={toToken.image}
                              alt={toToken.symbol}
                              className="currency-icon"
                              onError={(e) =>
                                ((e.target as HTMLImageElement).src =
                                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="%2314b8a6"/></svg>')
                              }
                            />
                            <span className="currency-symbol">
                              {toToken.symbol}
                            </span>
                          </>
                        ) : (
                          <span className="currency-placeholder">Select</span>
                        )}
                        <ExpandMore className="chevron-icon" />
                      </button>

                      {showToDropdown && (
                        <div className="dropdown-menu">
                          <div className="dropdown-search">
                            <input
                              type="text"
                              value={searchTo}
                              onChange={(e) => setSearchTo(e.target.value)}
                              placeholder="Search currencies..."
                              className="search-input"
                            />
                          </div>
                          <div className="dropdown-list">
                            {filteredToTokens.map((token) => (
                              <button
                                key={token.symbol}
                                onClick={() => {
                                  setToToken(token);
                                  setShowToDropdown(false);
                                  setSearchTo("");
                                  if (fromAmount)
                                    handleFromAmountChange(fromAmount);
                                }}
                                className="dropdown-item"
                              >
                                <div className="dropdown-item-left">
                                  <img
                                    src={token.image}
                                    alt={token.symbol}
                                    className="dropdown-icon"
                                    onError={(e) =>
                                      ((e.target as HTMLImageElement).src =
                                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="16" fill="%2314b8a6"/></svg>')
                                    }
                                  />
                                  <div className="dropdown-item-info">
                                    <div className="dropdown-item-symbol">
                                      {token.symbol}
                                    </div>
                                    <div className="dropdown-item-name">
                                      {token.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="dropdown-item-price">
                                  ${token.price.toFixed(4)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {toToken && toAmount && (
                  <div className="usd-equivalent">
                    ≈ ${(parseFloat(toAmount) * toToken.price).toFixed(2)} USD
                  </div>
                )}
              </div>

              {/* Exchange rate info */}
              {fromToken && toToken && (
                <div className="exchange-rate-card">
                  <div className="exchange-rate-content">
                    <div className="exchange-rate-left">
                      <div className="exchange-rate-header">
                        <TrendingUp className="rate-icon" />
                        <span className="rate-label">Exchange rate</span>
                      </div>
                      <p className="rate-value">
                        1 {fromToken.symbol} = {exchangeRate} {toToken.symbol}
                      </p>
                      <p className="rate-info">
                        Mid-market rate • Updates every minute
                      </p>
                    </div>
                    <div className="exchange-rate-right">
                      <div className="time-badge">
                        <AccessTime className="time-icon" />
                        <span>Instant</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Continue button */}
              <button
                onClick={() => {
                  if (!fromAmount || !toAmount) {
                    setError("Please enter an amount");
                    setTimeout(() => setError(""), 3000);
                    return;
                  }
                  alert(
                    `Swapping ${fromAmount} ${fromToken?.symbol} for ${toAmount} ${toToken?.symbol}`,
                  );
                }}
                disabled={!fromToken || !toToken || !fromAmount || !toAmount}
                className="continue-button"
              >
                {!fromToken || !toToken
                  ? "Select currencies to continue"
                  : !fromAmount || !toAmount
                    ? "Enter amount to continue"
                    : "Continue"}
              </button>
            </div>

            {/* Footer info */}
            <div className="card-footer">
              <div className="footer-content">
                <Info className="footer-icon" />
                <p className="footer-text">
                  <span className="footer-bold">Secure and transparent.</span>{" "}
                  We use the mid-market rate for all currency conversions. No
                  hidden fees.
                </p>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="trust-indicators">
            <div className="trust-item">
              <div className="trust-dot pulse"></div>
              <span>Powered by Switcheo</span>
            </div>
            <div className="trust-item">
              <div className="trust-dot"></div>
              <span>Real-time rates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

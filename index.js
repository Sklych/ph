const tabItems = new Map();
tabItems.set("stake", 0)
tabItems.set("community", 1)
tabItems.set("pool", 2)

const profitIntervals = new Map();
profitIntervals.set("day", 0)
profitIntervals.set("week", 1)
profitIntervals.set("month", 2)
profitIntervals.set("year", 3)

const TxStatus = {
    completed: 0,
    pending: 1,
    success: 2,
    failure: 3
}

const appState = {
    sliderValuePercent: 0,
    profitInterval: profitIntervals.get("day"),
    selectedTab: tabItems.get("stake"),
    connectedWallet: undefined
};

async function sendTransaction(tonConnectUI, amount, payload) {
    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60, // 60 sec exp time
        messages: [
            {
                address: "UQDde3w4YGvwyLci1IWtC2COwFj63dnI-b7QbPolGD7_oLNX",
                amount: amount * 10 ** 9,
                payload: payload
            },
        ]
    };

    try {
        return await tonConnectUI.sendTransaction(transaction);
    } catch (e) {
        console.error(e);
        return null;
    }
}

function updateStakingInfo(value, interval) {
    const stakingInfo = document.getElementById('staking-info');
    const now = new Date();

    function formatDate(date) {
        const options = { month: 'short', day: 'numeric' };
        if (date.getFullYear() !== now.getFullYear()) {
            options.year = 'numeric';
        }
        return date.toLocaleDateString('en-US', options);
    }

    const future = new Date(now);
    if (interval == profitIntervals.get("day")) {
        future.setDate(now.getDate() + 1);
    } else if (interval == profitIntervals.get("week")) {
        future.setDate(now.getDate() + 7);
    } else if (interval == profitIntervals.get("month")) {
        future.setDate(now.getMonth() + 1);
    } else if (interval == profitIntervals.get("year")) {
        future.setFullYear(now.getFullYear() + 1);
    } else {
        console.error(`Unknow interval=${interval} is passed to updateStakingInfo`)
    }

    stakingInfo.innerHTML = `
        You will earn <span class="highlight">${value.toFixed(2)} TON</span> on ${formatDate(future)}
    `;
}

function initSlider(profitPercent) {
    const slider = document.getElementById('staking-slider');
    const sliderText = document.getElementById('staking-slider-text');

    function updateSliderText(value) {
        sliderText.innerHTML = `<span class="highlight">${value} TON</span> you stake`;
    }

    function updateSliderBackground(slider) {
        const value = slider.value;
        const min = slider.min || 0;
        const max = slider.max || 100;
        const percentage = ((value - min) / (max - min)) * 100;

        slider.style.background = `linear-gradient(to right, #7CFC00 0%, #7CFC00 ${percentage}%, var(--color-accent) ${percentage}%, var(--color-accent) 100%)`;
    }

    function updateGUI(percent) {
        console.log(percent)
        const tonValue = mapSliderToTON(percent);
        console.log(percent, tonValue)
        appState.stakedValue = tonValue;
        updateSliderText(appState.stakedValue);
        updateSliderBackground(slider);
        updateStakingInfo(tonValue * profitPercent, appState.profitInterval);
    }

    function onSliderInput(e) {
        const percent = e.target.value;
        updateGUI(percent);
        playHapticNavigation();
    }

    slider.removeEventListener('input', onSliderInput);
    slider.addEventListener('input', onSliderInput);

    slider.value = appState.sliderValuePercent;
    updateGUI(appState.sliderValuePercent);
}

function formatProfitDate(ts) {
    if (!ts) return "";
    const date = new Date(ts * 1000); // timestamp in seconds → ms
    const options = { month: "short", day: "numeric" };
    return `You’ll receive profit on ${date.toLocaleDateString("en-US", options)}`;
}

function renderTransactions(transactions) {
    const list = document.querySelector(".cell-list");
    list.innerHTML = `<div style="height: 16px"></div>`;

    transactions.forEach(tx => {
        const cell = document.createElement("div");
        cell.className = "cell";

        const row = document.createElement("div");
        row.className = "row main-row";

        const column = document.createElement("div");
        column.className = "column";

        const title = document.createElement("span");
        title.className = "title";
        title.textContent = "Stake";
        column.appendChild(title);

        const vs = document.createElement("div");
        vs.className = "vertical-space";
        column.appendChild(vs);

        const amountsRow = document.createElement("div");
        amountsRow.className = "row";

        amountsRow.innerHTML = `
        <span class="text-secondary">${tx.staked_amount.toFixed(2)}</span>
        <img src="img/ton.svg" alt="ton" class="icon" />
        <span class="text-secondary">-></span>
        <span class="text-secondary">${tx.returned_amount.toFixed(2)}</span>
        <img src="img/ton.svg" alt="ton" class="icon" />
      `;
        column.appendChild(amountsRow);

        let rightElement;
        let iconSrc = "img/pending.svg";

        switch (tx.status) {
            case TxStatus.completed:
                iconSrc = "img/completed.svg";
                rightElement = document.createElement("span");
                rightElement.className = "view-blockchain";
                rightElement.textContent = "View Transaction";
                rightElement.addEventListener("click", () => {
                    window.playHapticNavigation();
                    window.open(`https://tonviewer.com/transaction/${tx.returned_tx_hash}`, "_blank");
                });
                break;

            case TxStatus.pending:
                iconSrc = "img/pending.svg";
                rightElement = document.createElement("span");
                rightElement.className = "text-secondary";
                rightElement.textContent = "Waiting confirmation";
                break;

                case TxStatus.success:
                    iconSrc = "img/completed.svg";
                    rightElement = document.createElement("img");
                    rightElement.src = "img/info.svg"; 
                    rightElement.className = "icon-info"; 
                    rightElement.alt = "info";
                
                    rightElement.addEventListener("click", () => {
                        playHapticNavigation();
                        window.openInfoModal(formatProfitDate(tx.time_stamp_profit));
                    });
                    break;

            case TxStatus.failure:
                iconSrc = "img/error.svg";
                rightElement = document.createElement("span");
                rightElement.className = "text-secondary";
                rightElement.textContent = "Transaction was not confirmed";
                break;
        }

        const icon = document.createElement("img");
        icon.src = iconSrc;
        icon.className = "cell-icon";
        icon.alt = "status";

        row.appendChild(column);
        row.appendChild(rightElement);

        cell.appendChild(icon);
        cell.appendChild(row);
        list.appendChild(cell);
    });
}

function mapSliderToTON(percent) {
    if (percent <= 20) {
        return (0.5 + percent * 0.5).toFixed(2);
    } else if (percent <= 40) {
        return (10 + ((percent - 20) * 1)).toFixed(2);
    } else if (percent <= 60) {
        return (30 + ((percent - 40) * 3)).toFixed(2);
    } else if (percent <= 80) {
        return (90 + ((percent - 60) * 10)).toFixed(2);
    } else {
        return (290 + ((percent - 80) * 15)).toFixed(2);
    }
}

function calculateStakedReturnedAmount(dailyProfitPercent) {
    const stakedAmount = mapSliderToTON(appState.sliderValuePercent)
    return [parseFloat(stakedAmount).toFixed(2), (parseFloat(stakedAmount * dailyProfitPercent)).toFixed(2)];
}

async function stakeAndPoll(txBoc, payoutInterval, senderWallet, stakedAmount, returnedAmount) {
    try {
        const initData = window.appConfig.telegramWebApp.initData;
        const stakeResult = await stake(initData, {
            tx_boc: txBoc,
            payout_interval: payoutInterval,
            wallet: senderWallet,
            staked_amount: stakedAmount,
            returned_amount: returnedAmount
        });

        if (!stakeResult.isAvailable) {
            const message = "Only one active stake is allowed";
            const icon = "img/warning.svg";
            const duration = 800;
            playHapticWarning();
            showSnackbar(message, icon, duration);
        } else {
            renderTransactions(stakeResult.transactions);
            const ref = null;
            const pollTransactions = async () => {
                try {
                    const result = await window.getUserSnapshot(initData, ref);
                    console.log(`Pool transaction status. result=${JSON.stringify(result)}`)
                    if (result && result.transactions) {
                        renderTransactions(result.transactions);
                    }
                    const shouldPoll = result.transactions.some(tx => tx.status === TxStatus.pending);
                    if (shouldPoll) {
                        setTimeout(pollTransactions, 10_000);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            };
            setTimeout(pollTransactions, 10_000);
        }
    } catch (error) {
        console.error(error);
    }
}

function updateStakeButtonText(stakeButton, wallet) {
    if (wallet) {
        stakeButton.textContent = "Stake"
    } else {
        stakeButton.textContent = "Connect wallet"
    }
}

async function isLocalStakeAvailable(transactions) {
    console.log("index js isStakeAvailable initData", window.appConfig.telegramWebApp.initData)
    const isNotAvailable = transactions && transactions.some(tx => tx.status === TxStatus.pending || tx.status === TxStatus.success);
    console.log(`index js isStakeAvailable from local txs isNotAvailable=${isNotAvailable}`)
    return !isNotAvailable && await window.isStakeAvailable(window.appConfig.telegramWebApp.initData)
}

function updateStakeButton(tonConnectUI, user) {
    const stakeButton = document.getElementById("stakeBtn")
    updateStakeButtonText(stakeButton, tonConnectUI.wallet)
    function stakeButtonListener() {
        console.log("stakeButtonListener click")
        const isWalletConected = tonConnectUI.wallet
        console.log('wallet ', isWalletConected, isWalletConected && isWalletConected.account.address)
        playHapticNavigation();
        if (isWalletConected) {
            (async () => {
                try {
                    const isStkAvailable = await isLocalStakeAvailable(user.transactions);
                    console.log("isStakeAvailable=", isStkAvailable)
                    if (!isStkAvailable) {
                        const message = "Only one active stake is allowed";
                        const icon = "img/warning.svg";
                        const duration = 800;
                        playHapticWarning();
                        showSnackbar(message, icon, duration);
                        return
                    }
                    const amount = 0.01;
                    const payload = user.payload;
                    const txBoc = await sendTransaction(tonConnectUI, amount, payload);
                    // const txBoc = "te6cckEBBAEAtgAB5YgBuvb4cMDX4ZFuRakLWhbBHYCx9buzkfN9oNn0SjB9/0ADm0s7c///+ItFZA5IAAAAfFouCHmtjC+ql+83LVIKd+yMpFw0e3oGK36CRM/8+Xd7FwbIM6qQI3gPsaAJSc9NJGo2EO2f3JsRmGfpMW7GUA0BAgoOw8htAwIDAAAAZkIAbWCkBbDahLD3RuEhuE4EzaqpIQFGjt3G6Idph04YoROcxLQAAAAAAAAAAAAAAAAAAIOv1IY=";
                    console.log("Tx boc ", txBoc)
                    const payoutInterval = appState.profitInterval;
                    const senderWalet = tonConnectUI.wallet.account.address;
                    const localStake = calculateStakedReturnedAmount(user.dailyProfitPercent);
                    const stakedAmount = localStake[0];
                    const returnedAmount = localStake[1];
                    if (txBoc) {
                        console.log("Tx result ", JSON.stringify(txBoc))
                        const message = "Success";
                        const icon = "img/completed.svg"
                        playHapticSuccess();
                        showSnackbar(message, icon);
                        await stakeAndPoll(txBoc.boc, payoutInterval, senderWalet, stakedAmount, returnedAmount)
                    } else {
                        const message = "Transaction cancelled. Try again";
                        const icon = "img/error.svg"
                        playHapticError();
                        showSnackbar(message, icon);
                    }
                } catch (e) {
                    const message = "Error. Try again";
                    const icon = "img/error.svg"
                    playHapticError();
                    showSnackbar(message, icon);
                    console.error(e);
                }
            })();
        } else {
            tonConnectUI.openModal();
        }
    }

    stakeButton.addEventListener("click", stakeButtonListener)
    stakeButton.style.display = 'block'
}

function initUi(user) {
    initSlider(user.dailyProfitPercent);
    renderTransactions(user.transactions)

    const tabs = document.querySelectorAll(".tab-item");
    const payoutProfitButtons = document.querySelectorAll(".interval-btn");

    function updateTabsSelection() {
        tabs.forEach((tab, index) => {
            if (index === appState.selectedTab) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    }

    function updatePayoutProfitButtonsSelection() {
        payoutProfitButtons.forEach((btn, index) => {
            if (index === appState.profitInterval) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => {
            playHapticNavigation();
            if (index === tabItems.get("stake")) {
                appState.selectedTab = index;
                updateTabsSelection();
            } else if (index === tabItems.get("community")) {
                window.open("https://t.me/myphrill_community")
            } else if (index === tabItems.get("pool")) {
                const message = "Available soon";
                const icon = null;
                const duration = 800;
                playHapticWarning();
                showSnackbar(message, icon, duration);
            }
            else {
                console.log(`Uknown tab with index=${index} clicked`)
            }
        });
    });

    payoutProfitButtons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            playHapticNavigation();
            if (index === profitIntervals.get("day")) {
                appState.profitInterval = index;
                updatePayoutProfitButtonsSelection()
            } else if (index === profitIntervals.get("week")) {
                const message = "Available soon";
                const icon = null;
                playHapticWarning();
                showSnackbar(message, icon);
            } else if (index === profitIntervals.get("month")) {
                const message = "Available soon";
                const icon = null;
                playHapticWarning();
                showSnackbar(message, icon);
            } else if (index === profitIntervals.get("year")) {
                const message = "Available soon";
                const icon = null;
                playHapticWarning();
                showSnackbar(message, icon);
            }
        })
    });

    updateTabsSelection()
    updatePayoutProfitButtonsSelection();
}

window.onload = function () {
    (async () => {
        try {
            const stakeButton = document.getElementById("stakeBtn")
            const initData = window.appConfig.telegramWebApp.initData;
            const ref = window.appConfig.telegramWebApp.initDataUnsafe.start_param;
            const result = await window.getUserSnapshot(initData, ref);
            if (result) {
                console.log(`Load user=${JSON.stringify(result)}`)
                initUi(result);
                const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                    manifestUrl: 'https://sklych.github.io/ph/tonconnect-manifest.json',
                    language: 'en',
                });
                updateStakeButton(tonConnectUI, result)
                tonConnectUI.onStatusChange(wallet => {
                    updateStakeButtonText(stakeButton, wallet)
                })
            } else {
                throw Error("No data loaded")
            }
        } catch (e) {
            const message = "Could not load data. Reload MiniApp";
            const icon = "img/error.svg"
            playHapticError();
            showSnackbar(message, icon);
            console.error(e);
        }
    })();
};


const tabItems = new Map();
tabItems.set("stake", 0)
tabItems.set("community", 1)

const profitIntervals = new Map();
profitIntervals.set("day", 0)
profitIntervals.set("week", 1)
profitIntervals.set("month", 2)
profitIntervals.set("year", 3)

const appState = {
    sliderValuePercent: 0,
    profitInterval: profitIntervals.get("day"),
    selectedTab: tabItems.get("stake"),
    connectedWallet: undefined
};

function updateStakingInfo(value) {
    const stakingInfo = document.getElementById('staking-info');
    const now = new Date();

    function formatDate(date) {
        const options = { month: 'short', day: 'numeric' };
        if (date.getFullYear() !== now.getFullYear()) {
            options.year = 'numeric';
        }
        return date.toLocaleDateString('en-US', options);
    }

    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);

    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const nextMonth = new Date(now);
    nextMonth.setMonth(now.getMonth() + 1);

    const nextYear = new Date(now);
    nextYear.setFullYear(now.getFullYear() + 1);

    stakingInfo.innerHTML = `
        You will earn <span class="highlight">${value} TON</span> on ${formatDate(nextDay)} or ${formatDate(nextWeek)} or ${formatDate(nextMonth)} or ${formatDate(nextYear)}
    `;
}

function initSlider() {
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

    function updateGUI(percent) {
        console.log(percent)
        const tonValue = mapSliderToTON(percent);
        console.log(percent, tonValue)
        appState.stakedValue = tonValue;
        updateSliderText(appState.stakedValue);
        updateSliderBackground(slider);
        updateStakingInfo(tonValue);
    }

    slider.addEventListener('input', (e) => {
        const percent = e.target.value;
        updateGUI(percent)
        updateStakingInfo(percent);
        playHapticNavigation();
    });

    slider.value = appState.sliderValuePercent;
    updateGUI(appState.sliderValuePercent);
}

function updateStakeButton(tonConnectUI) {
    const stakeButton = document.getElementById("stakeBtn")
    const isWalletConected = tonConnectUI.wallet
    console.log('wallet ', isWalletConected)
    if (isWalletConected) {
        stakeButton.textContent = "Stake"
    } else {
        stakeButton.textContent = "Connect wallet"
    }

    stakeButton.addEventListener("click", () => {
        playHapticNavigation();
        if (isWalletConected) {
            // todo init transaction
        } else {
            tonConnectUI.openModal();
        }
    })
    stakeButton.style.display = 'block'
}

function initUi() {
    initSlider();
   

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
                // Community
            } else {
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
                appState.profitInterval = index;
                updatePayoutProfitButtonsSelection()
            } else if (index === profitIntervals.get("month")) {
                const message = "Not available";
                const icon = "../img/warning.svg"
                playHapticWarning();
                showSnackbar(message, icon);
            } else if (index === profitIntervals.get("year")) {
                const message = "Not available";
                const icon = "../img/warning.svg"
                playHapticWarning();
                showSnackbar(message, icon);
            }
        })
    });

    updateTabsSelection()  
    updatePayoutProfitButtonsSelection();  
}

window.onload = function () {
    initUi();
    const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://sklych.github.io/door/tonconnect-manifest.json', // todo replace
        language: 'en',
    });
    tonConnectUI.onStatusChange(wallet => {
        updateStakeButton(tonConnectUI)
    })
};


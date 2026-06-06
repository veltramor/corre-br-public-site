const items = [
  { id: "massa", name: "Massa", level: 1, value: 12 },
  { id: "molho", name: "Molho", level: 1, value: 12 },
  { id: "marmita", name: "Marmita", level: 2, value: 28 },
  { id: "suco", name: "Suco", level: 2, value: 30 },
  { id: "pastel", name: "Pastel", level: 3, value: 45 },
  { id: "combo", name: "Combo", level: 4, value: 74 },
  { id: "lanche", name: "Lanche", level: 5, value: 98 },
  { id: "festa", name: "Kit Festa", level: 6, value: 154 }
];

const customers = ["Bia", "Rafa", "Dona Ana", "Leo", "Nanda"];

const businesses = [
  { id: "barraca", name: "Barraca Da Esquina", requirement: "Inicial", cost: 0 },
  { id: "oficina", name: "Oficina Do Bairro", requirement: "Nível 2", cost: 320 },
  { id: "salao", name: "Salão Da Vila", requirement: "Nível 3", cost: 520 },
  { id: "delivery", name: "Delivery Da Quebrada", requirement: "Nível 4", cost: 780 }
];

const state = {
  coins: 320,
  energy: 18,
  level: 1,
  xp: 0,
  shopStage: 0,
  currentBusiness: "barraca",
  unlockedBusinesses: ["barraca"],
  noAdsTrial: false,
  passTrial: false,
  selected: null,
  tutorialStep: 0,
  board: Array.from({ length: 25 }, (_, index) => (index > 16 ? { locked: true } : null)),
  orders: [],
  events: []
};

const stages = [
  "Barraca simples",
  "Placa nova",
  "Balcão melhor",
  "Ajudante",
  "Lanchonete pequena"
];

const $ = (selector) => document.querySelector(selector);

const logEvent = (name, payload = {}) => {
  state.events.push({ name, payload, at: new Date().toISOString() });
  localStorage.setItem("correBrEvents", JSON.stringify(state.events.slice(-120)));
};

const randomItem = (maxLevel = 2) => {
  const pool = items.filter((item) => item.level <= maxLevel);
  return { ...pool[Math.floor(Math.random() * pool.length)] };
};

const createOrders = () => {
  state.orders = [2, 3, 4].map((level, index) => {
    const item = items.find((entry) => entry.level === level) || items[2];
    return {
      id: crypto.randomUUID(),
      customer: customers[index],
      itemId: item.id,
      itemName: item.name,
      reward: item.value + 30 + index * 12
    };
  });
};

const render = () => {
  $("#coinsValue").textContent = state.coins;
  $("#energyValue").textContent = state.energy;
  $("#levelValue").textContent = state.level;
  $("#xpValue").textContent = `${state.xp}/100`;
  $("#shopStage").textContent = stages[state.shopStage];
  $("#shopName").textContent = businesses.find((business) => business.id === state.currentBusiness)?.name || "Barraca Da Esquina";

  $("#ordersList").innerHTML = state.orders
    .map(
      (order) => `
        <article class="order-card">
          <span class="order-customer">${order.customer}</span>
          <span class="order-item">${order.itemName}</span>
          <strong class="order-reward">${order.reward} moedas</strong>
        </article>
      `
    )
    .join("");

  $("#mergeBoard").innerHTML = state.board
    .map((cell, index) => {
      if (cell?.locked) {
        return `<button class="cell locked" data-index="${index}" aria-label="Espaço bloqueado">Trava</button>`;
      }

      if (!cell) {
        return `<button class="cell" data-index="${index}" aria-label="Espaço vazio"></button>`;
      }

      const selected = state.selected === index ? " selected" : "";
      return `
        <button class="cell${selected}" data-index="${index}" aria-label="${cell.name}">
          <span class="item-name">${cell.name}</span>
          <span class="item-level">${cell.level}</span>
        </button>
      `;
    })
    .join("");

  const selectedItem = state.selected !== null ? state.board[state.selected] : null;
  $("#selectedName").textContent = selectedItem?.name || "Selecione um item";
  $("#selectedHint").textContent = selectedItem
    ? `Nível ${selectedItem.level}. Combine com outro igual ou venda por ${selectedItem.value} moedas.`
    : "Combine dois itens iguais ou entregue um pedido.";
  $("#sellButton").disabled = !selectedItem;
};

const showModal = (title, text, actions) => {
  $("#modalTitle").textContent = title;
  $("#modalText").textContent = text;
  $("#modalActions").innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.textContent = action.label;
    button.className = action.secondary ? "secondary" : "";
    button.addEventListener("click", () => {
      $("#modal").classList.add("is-hidden");
      action.onClick?.();
      render();
    });
    $("#modalActions").appendChild(button);
  });
  $("#modal").classList.remove("is-hidden");
};

const showRichModal = (title, html, actions) => {
  $("#modalTitle").textContent = title;
  $("#modalText").innerHTML = html;
  $("#modalActions").innerHTML = "";
  actions.forEach((action) => {
    const button = document.createElement("button");
    button.textContent = action.label;
    button.className = action.secondary ? "secondary" : "";
    button.addEventListener("click", () => {
      $("#modal").classList.add("is-hidden");
      action.onClick?.();
      render();
    });
    $("#modalActions").appendChild(button);
  });
  $("#modal").classList.remove("is-hidden");
};

const addXp = (amount) => {
  state.xp += amount;
  if (state.xp >= 100) {
    state.xp -= 100;
    state.level += 1;
    state.coins += 60;
    logEvent("level_up", { level: state.level });
    showModal("Subiu de nível!", "Seu corre ficou mais conhecido no bairro.", [
      { label: "Continuar" }
    ]);
  }
};

const completeOrderIfPossible = (item, index) => {
  const orderIndex = state.orders.findIndex((order) => order.itemId === item.id);
  if (orderIndex === -1) return false;

  const [order] = state.orders.splice(orderIndex, 1);
  state.board[index] = null;
  state.coins += order.reward;
  addXp(24);
  logEvent("order_completed", { item: item.id, reward: order.reward });
  state.orders.push({
    id: crypto.randomUUID(),
    customer: customers[Math.floor(Math.random() * customers.length)],
    ...(() => {
      const nextItem = randomItem(Math.min(5, state.level + 2));
      return { itemId: nextItem.id, itemName: nextItem.name, reward: nextItem.value + 38 };
    })()
  });

  showModal("Pedido entregue!", `Você ganhou ${order.reward} moedas.`, [
    {
      label: "Dobrar com anúncio",
      onClick: () => {
        logEvent("rewarded_ad_completed", { placement: "double_order" });
        state.coins += order.reward;
        showModal("Recompensa dobrada", "Anúncio simulado concluído.", [{ label: "Boa" }]);
      }
    },
    { label: "Continuar", secondary: true }
  ]);
  return true;
};

const selectCell = (index) => {
  const cell = state.board[index];
  if (cell?.locked) {
    showModal("Espaço bloqueado", "Melhore o negócio para liberar mais espaço.", [{ label: "Entendi" }]);
    return;
  }

  if (!cell) {
    state.selected = null;
    render();
    return;
  }

  if (state.selected === null) {
    state.selected = index;
    logEvent("item_selected", { item: cell.id });
    render();
    return;
  }

  const selectedItem = state.board[state.selected];
  if (state.selected !== index && selectedItem?.id === cell.id) {
    const next = items.find((item) => item.level === cell.level + 1) || items[items.length - 1];
    state.board[index] = { ...next };
    state.board[state.selected] = null;
    state.selected = index;
    addXp(12);
    logEvent("item_merged", { from: cell.id, to: next.id });
    completeOrderIfPossible(next, index);
    render();
    return;
  }

  state.selected = index;
  render();
};

const generateItem = () => {
  if (state.energy <= 0) {
    logEvent("rewarded_ad_offered", { placement: "energy_empty" });
    showModal("Energia acabou", "Assista um anúncio simulado para ganhar energia extra.", [
      {
        label: "Ganhar energia",
        onClick: () => {
          state.energy += 8;
          logEvent("rewarded_ad_completed", { placement: "energy_empty" });
        }
      },
      { label: "Depois", secondary: true }
    ]);
    return;
  }

  const emptyIndex = state.board.findIndex((cell) => cell === null);
  if (emptyIndex === -1) {
    showModal("Grade cheia", "Venda ou combine itens para abrir espaço.", [{ label: "Entendi" }]);
    return;
  }

  state.board[emptyIndex] = randomItem(2);
  state.energy -= 1;
  logEvent("item_generated", { index: emptyIndex });
  render();
};

const sellSelected = () => {
  if (state.selected === null) return;
  const item = state.board[state.selected];
  if (!item) return;

  if (!completeOrderIfPossible(item, state.selected)) {
    state.coins += item.value;
    addXp(5);
    logEvent("item_sold", { item: item.id, value: item.value });
    state.board[state.selected] = null;
    state.selected = null;
  }
  render();
};

const upgradeBusiness = () => {
  const cost = 180 + state.shopStage * 120;
  if (state.shopStage >= stages.length - 1) {
    showModal("No topo do bairro", "Novos upgrades entram na próxima versão.", [{ label: "Fechado" }]);
    return;
  }

  if (state.coins < cost) {
    showModal("Falta moeda", `Você precisa de ${cost} moedas para melhorar agora.`, [
      {
        label: "Ganhar 120 com anúncio",
        onClick: () => {
          state.coins += 120;
          logEvent("rewarded_ad_completed", { placement: "upgrade_shortfall" });
        }
      },
      { label: "Continuar jogando", secondary: true }
    ]);
    return;
  }

  state.coins -= cost;
  state.shopStage += 1;
  const lockedIndex = state.board.findIndex((cell) => cell?.locked);
  if (lockedIndex !== -1) state.board[lockedIndex] = null;
  addXp(35);
  logEvent("business_upgrade_purchased", { stage: state.shopStage });
  showModal("Negócio melhorado!", stages[state.shopStage], [{ label: "Bora" }]);
  render();
};

const claimDailyReward = () => {
  state.coins += 90;
  state.energy += 5;
  logEvent("daily_reward_claimed");
  showModal("Recompensa diária", "Você ganhou 90 moedas e 5 energia.", [{ label: "Coletar" }]);
};

const showEvent = () => {
  const score = state.coins + state.level * 120 + state.shopStage * 250;
  showModal(
    "Ranking semanal",
    `Sua pontuacao: ${score}. Meta da semana: entrar no Top 20 do bairro.`,
    [
      { label: "Ver evento" },
      {
        label: "Compartilhar progresso",
        secondary: true,
        onClick: () => logEvent("share_progress_clicked", { score })
      }
    ]
  );
  logEvent("ranking_viewed", { score });
};

const showMap = () => {
  const rows = businesses
    .map((business) => {
      const unlocked = state.unlockedBusinesses.includes(business.id);
      const active = state.currentBusiness === business.id;
      const status = active ? "Atual" : unlocked ? "Liberado" : `${business.requirement} + ${business.cost} moedas`;
      return `<div class="choice-row"><strong>${business.name}</strong><span>${status}</span></div>`;
    })
    .join("");
  const nextBusiness = businesses.find((business) => !state.unlockedBusinesses.includes(business.id));

  showRichModal("Mapa do bairro", `<div class="choice-list">${rows}</div>`, [
    {
      label: nextBusiness ? `Liberar ${nextBusiness.name}` : "Tudo liberado",
      onClick: () => {
        if (!nextBusiness) return;
        if (state.level < businesses.indexOf(nextBusiness) + 1 || state.coins < nextBusiness.cost) {
          showModal("Ainda não dá", "Ganhe nível e moedas para abrir esse negócio.", [{ label: "Continuar" }]);
          return;
        }
        state.coins -= nextBusiness.cost;
        state.unlockedBusinesses.push(nextBusiness.id);
        state.currentBusiness = nextBusiness.id;
        logEvent("business_unlocked", { business: nextBusiness.id });
        showModal("Novo negócio!", `${nextBusiness.name} entrou no seu corre.`, [{ label: "Bora" }]);
      }
    },
    {
      label: "Trocar negócio",
      secondary: true,
      onClick: () => {
        const currentIndex = state.unlockedBusinesses.indexOf(state.currentBusiness);
        const nextId = state.unlockedBusinesses[(currentIndex + 1) % state.unlockedBusinesses.length];
        state.currentBusiness = nextId;
        logEvent("business_switched", { business: nextId });
      }
    }
  ]);
  logEvent("map_viewed", { unlocked: state.unlockedBusinesses.length });
};

const showStore = () => {
  const passStatus = state.passTrial ? "Ativo neste teste" : "Teste por R$ 4,90/mês";
  const noAdsStatus = state.noAdsTrial ? "Ativo neste teste" : "Compra única simulada";
  showRichModal(
    "Loja do Corre",
    `<div class="choice-list">
      <div class="choice-row"><strong>Passe do Bairro</strong><span>${passStatus}</span></div>
      <div class="choice-row"><strong>Sem anúncios</strong><span>${noAdsStatus}</span></div>
      <div class="choice-row"><strong>Pacote inicial</strong><span>250 moedas + 10 energia</span></div>
    </div>`,
    [
      {
        label: "Testar passe",
        onClick: () => {
          state.passTrial = true;
          state.coins += 180;
          state.energy += 8;
          logEvent("pass_trial_started", { price: "4.90" });
        }
      },
      {
        label: "Testar sem anúncios",
        secondary: true,
        onClick: () => {
          state.noAdsTrial = true;
          logEvent("no_ads_trial_started");
        }
      }
    ]
  );
  logEvent("store_viewed");
};

const startGame = () => {
  $("#startScreen").classList.add("is-hidden");
  $("#gameScreen").classList.remove("is-hidden");
  logEvent("tutorial_start");
  showModal("Primeiro corre", "Toque em Gerar item, combine dois iguais e entregue pedidos.", [
    {
      label: "Começar",
      onClick: () => logEvent("tutorial_complete")
    }
  ]);
};

const setup = () => {
  createOrders();
  state.board[0] = { ...items[0] };
  state.board[1] = { ...items[0] };
  state.board[2] = { ...items[1] };
  state.board[5] = { ...items[1] };
  state.board[6] = { ...items[2] };
  render();

  $("#startButton").addEventListener("click", startGame);
  $("#generateButton").addEventListener("click", generateItem);
  $("#sellButton").addEventListener("click", sellSelected);
  $("#upgradeButton").addEventListener("click", upgradeBusiness);
  $("#mapButton").addEventListener("click", showMap);
  $("#storeButton").addEventListener("click", showStore);
  $("#dailyRewardButton").addEventListener("click", claimDailyReward);
  $("#eventButton").addEventListener("click", showEvent);
  $("#mergeBoard").addEventListener("click", (event) => {
    const cell = event.target.closest(".cell");
    if (!cell) return;
    selectCell(Number(cell.dataset.index));
  });
};

setup();

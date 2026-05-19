(function () {
  const storageKey = "hachikoFriendsLeadsCenter";
  const today = new Date().toISOString().slice(0, 10);

  const marketerName = document.querySelector("#marketerName");
  const workDate = document.querySelector("#workDate");
  const addLeadButton = document.querySelector("[data-add-lead]");
  const closeFormButton = document.querySelector("[data-close-form]");
  const newDayButton = document.querySelector("[data-new-day]");
  const exportButton = document.querySelector("[data-export]");
  const form = document.querySelector("[data-form]");
  const list = document.querySelector("[data-list]");
  const empty = document.querySelector("[data-empty]");
  const template = document.querySelector("#lead-template");
  const formTitle = document.querySelector("[data-form-title]");
  const submitLeadButton = document.querySelector("[data-submit-lead]");
  const resetLeadButton = document.querySelector("[data-reset-lead]");
  const feedbackToggle = document.querySelector("[data-feedback-toggle]");
  const feedbackOptions = document.querySelector("[data-feedback-options]");
  const lostToggle = document.querySelector("[data-lost-toggle]");
  const lostReason = document.querySelector("[data-lost-reason]");
  const interestInput = form.elements.interestLevel;
  const interestOutput = document.querySelector("[data-interest-output]");
  const totals = {
    total: document.querySelector("[data-total]"),
    average: document.querySelector("[data-average]"),
    lost: document.querySelector("[data-lost-count]")
  };

  let state = loadState();
  let editingLeadId = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      return {
        marketerName: saved?.marketerName || "",
        workDate: saved?.workDate || today,
        leads: Array.isArray(saved?.leads) ? saved.leads : []
      };
    } catch (error) {
      return { marketerName: "", workDate: today, leads: [] };
    }
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function yesNo(value) {
    return value ? "نعم" : "لا";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function syncTopFields() {
    marketerName.value = state.marketerName;
    workDate.value = state.workDate || today;
  }

  function syncConditionalFields() {
    feedbackOptions.classList.toggle("is-hidden", !feedbackToggle.checked);
    lostReason.classList.toggle("is-hidden", !lostToggle.checked);

    if (!feedbackToggle.checked) {
      form.querySelectorAll("[name='feedbackType']").forEach((input) => {
        input.checked = false;
      });
    }

    if (!lostToggle.checked) {
      form.elements.lostReason.value = "";
    }
  }

  function setFormMode(isEditing) {
    formTitle.textContent = isEditing ? "تعديل الليد" : "إضافة ليد جديد";
    submitLeadButton.textContent = isEditing ? "حفظ التعديل" : "حفظ الليد";
    resetLeadButton.textContent = isEditing ? "إلغاء التعديل" : "تفريغ النموذج";
  }

  function clearLeadForm() {
    editingLeadId = null;
    setFormMode(false);
    form.reset();
    interestOutput.textContent = interestInput.value;
    syncConditionalFields();
  }

  function readLeadForm() {
    const data = new FormData(form);
    const hasFeedback = form.elements.hasFeedback.checked;
    const isLost = form.elements.isLost.checked;

    return {
      clientName: data.get("clientName").trim(),
      location: data.get("location").trim(),
      newConversation: form.elements.newConversation.checked,
      previousPurchase: form.elements.previousPurchase.checked,
      hasFeedback,
      feedbackType: hasFeedback ? data.get("feedbackType") || "" : "",
      interestLevel: Number(data.get("interestLevel")),
      specialRequests: data.get("specialRequests").trim(),
      isLost,
      lostReason: isLost ? data.get("lostReason").trim() : ""
    };
  }

  function collectLead() {
    return {
      id: window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      marketerName: state.marketerName,
      workDate: state.workDate,
      createdAt: new Date().toLocaleString("ar-EG"),
      ...readLeadForm()
    };
  }

  function collectLeadEdit(lead) {
    return {
      ...lead,
      marketerName: state.marketerName,
      workDate: state.workDate,
      ...readLeadForm()
    };
  }

  function populateLeadForm(lead) {
    form.elements.clientName.value = lead.clientName || "";
    form.elements.location.value = lead.location || "";
    form.elements.newConversation.checked = Boolean(lead.newConversation);
    form.elements.previousPurchase.checked = Boolean(lead.previousPurchase);
    form.elements.hasFeedback.checked = Boolean(lead.hasFeedback);
    form.querySelectorAll("[name='feedbackType']").forEach((input) => {
      input.checked = input.value === lead.feedbackType;
    });
    form.elements.interestLevel.value = lead.interestLevel || 5;
    interestOutput.textContent = form.elements.interestLevel.value;
    form.elements.specialRequests.value = lead.specialRequests || "";
    form.elements.isLost.checked = Boolean(lead.isLost);
    form.elements.lostReason.value = lead.lostReason || "";
    syncConditionalFields();
  }

  function editLead(lead) {
    editingLeadId = lead.id;
    setFormMode(true);
    populateLeadForm(lead);
    form.classList.remove("is-hidden");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    form.elements.clientName.focus();
  }

  function renderStats() {
    const count = state.leads.length;
    const interestTotal = state.leads.reduce((sum, lead) => sum + Number(lead.interestLevel || 0), 0);
    const lostCount = state.leads.filter((lead) => lead.isLost).length;

    totals.total.textContent = count;
    totals.average.textContent = count ? (interestTotal / count).toFixed(1) : "0";
    totals.lost.textContent = lostCount;
  }

  function renderLeads() {
    list.innerHTML = "";
    empty.classList.toggle("is-hidden", state.leads.length > 0);

    state.leads.forEach((lead) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.querySelector("[data-name]").textContent = lead.clientName;
      card.querySelector("[data-location]").textContent = lead.location;
      card.querySelector("[data-new-conversation]").textContent = yesNo(lead.newConversation);
      card.querySelector("[data-previous-purchase]").textContent = yesNo(lead.previousPurchase);
      card.querySelector("[data-feedback]").textContent = lead.hasFeedback ? lead.feedbackType || "غير محدد" : "لا";
      card.querySelector("[data-interest]").textContent = `${lead.interestLevel} / 10`;
      card.querySelector("[data-lost]").textContent = yesNo(lead.isLost);

      const requests = card.querySelector("[data-requests]");
      requests.textContent = lead.specialRequests ? `طلبات خاصة: ${lead.specialRequests}` : "";
      requests.classList.toggle("is-hidden", !lead.specialRequests);

      const reason = card.querySelector("[data-reason]");
      reason.textContent = lead.lostReason ? `سبب الفقدان: ${lead.lostReason}` : "";
      reason.classList.toggle("is-hidden", !lead.lostReason);

      card.querySelector("[data-edit]").addEventListener("click", () => {
        editLead(lead);
      });

      card.querySelector("[data-delete]").addEventListener("click", () => {
        if (!confirm("هل أنت متأكد من حذف هذا الليد؟")) return;

        state.leads = state.leads.filter((item) => item.id !== lead.id);
        if (editingLeadId === lead.id) {
          clearLeadForm();
          form.classList.add("is-hidden");
        }
        saveState();
        render();
      });

      list.appendChild(card);
    });
  }

  function render() {
    renderStats();
    renderLeads();
  }

  function excelTable() {
    const columns = [
      "اسم المسوق",
      "تاريخ اليوم",
      "وقت الإضافة",
      "اسم العميل",
      "المكان",
      "محادثة جديدة",
      "سبق الشراء من قبل",
      "فيدباك",
      "نوع الفيدباك",
      "مستوى الاهتمام",
      "طلبات خاصة",
      "تم فقدانه",
      "أسباب الفقدان"
    ];

    const rows = state.leads.map((lead) => [
      lead.marketerName || state.marketerName,
      lead.workDate || state.workDate,
      lead.createdAt,
      lead.clientName,
      lead.location,
      yesNo(lead.newConversation),
      yesNo(lead.previousPurchase),
      yesNo(lead.hasFeedback),
      lead.feedbackType,
      lead.interestLevel,
      lead.specialRequests,
      yesNo(lead.isLost),
      lead.lostReason
    ]);

    const head = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
    const body = rows
      .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
      .join("");

    return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; direction: rtl; }
    table { border-collapse: collapse; }
    th, td { border: 1px solid #999; padding: 8px; text-align: right; mso-number-format:"\\@"; }
    th { background: #00bfa6; color: #06231f; font-weight: bold; }
  </style>
</head>
<body>
  <table>
    <thead><tr>${head}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;
  }

  function exportExcel() {
    if (!state.leads.length) {
      alert("لا توجد ليدز للتصدير");
      return;
    }

    const blob = new Blob([excelTable()], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads-center-${state.workDate || today}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  marketerName.addEventListener("input", () => {
    state.marketerName = marketerName.value.trim();
    saveState();
  });

  workDate.addEventListener("input", () => {
    state.workDate = workDate.value || today;
    saveState();
  });

  addLeadButton.addEventListener("click", () => {
    clearLeadForm();
    form.classList.remove("is-hidden");
    form.elements.clientName.focus();
  });

  closeFormButton.addEventListener("click", () => {
    clearLeadForm();
    form.classList.add("is-hidden");
  });

  feedbackToggle.addEventListener("change", syncConditionalFields);
  lostToggle.addEventListener("change", syncConditionalFields);

  interestInput.addEventListener("input", () => {
    interestOutput.textContent = interestInput.value;
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      editingLeadId = null;
      setFormMode(false);
      interestOutput.textContent = interestInput.value;
      syncConditionalFields();
    }, 0);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    state.marketerName = marketerName.value.trim();
    state.workDate = workDate.value || today;

    if (!state.marketerName) {
      alert("اكتب اسم المسوق أولا");
      marketerName.focus();
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (editingLeadId) {
      state.leads = state.leads.map((lead) => {
        return lead.id === editingLeadId ? collectLeadEdit(lead) : lead;
      });
    } else {
      state.leads.unshift(collectLead());
    }

    saveState();
    clearLeadForm();
    render();
  });

  newDayButton.addEventListener("click", () => {
    if (!confirm("هل تريد مسح كل الليدز وبدء يوم جديد؟")) return;

    state = { marketerName: "", workDate: today, leads: [] };
    localStorage.removeItem(storageKey);
    syncTopFields();
    clearLeadForm();
    render();
  });

  exportButton.addEventListener("click", exportExcel);

  syncTopFields();
  syncConditionalFields();
  render();
})();

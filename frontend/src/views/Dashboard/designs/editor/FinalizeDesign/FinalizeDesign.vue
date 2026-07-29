<template>
  <MainLayout>
    <div class="finalize-wrapper">
      <div class="card-container">
        <h2 class="title">مرحله نهایی طراحی</h2>

        <div class="content-layout">
          <!-- پیش‌نمایش کارت - سمت چپ در دسکتاپ -->
          <div class="preview-section">
            <div class="preview-box">
              <img :src="preview" class="preview-image" />
            </div>
          </div>

          <!-- فرم و دکمه‌ها - سمت راست در دسکتاپ -->
          <div class="form-section">
            <label class="label">نام طراحی</label>
            <input v-model="name" class="input" placeholder="نام طرح را وارد کنید" />

            <div class="actions">
              <button class="btn primary" @click="saveAndDownload" :disabled="saving">
                <span v-if="!saving">✔ ذخیره و دانلود</span>
                <span v-else>⏳ در حال ذخیره...</span>
              </button>

              <button class="btn secondary" @click="cancel">
                ← بازگشت
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import designService from "../../../../../services/design.service";
import MainLayout from "../../../../../components/dashboard/layout/MainLayout.vue";

const router = useRouter();

const name = ref("");
const preview = ref("");
const json = ref(null);
const isTemplate = ref(false);
const saving = ref(false);
const existingDesigns = ref([]);

const DEFAULT_NAME = "قالب تکنوکارت";

onMounted(async () => {
  const data = JSON.parse(sessionStorage.getItem("pendingDesign"));

  if (!data) {
    router.push("/dashboard");
    return;
  }

  preview.value = data.preview;
  json.value = data.json;
  isTemplate.value = data.is_template;

  await loadExistingDesigns();

  if (data.name) {
    name.value = generateUniqueName(data.name);
  } else {
    name.value = generateUniqueName(DEFAULT_NAME);
  }
});

async function loadExistingDesigns() {
  try {
    const res = await designService.getDesigns();
    existingDesigns.value = res.data || res;
  } catch (error) {
    console.error("خطا در لود طراحی‌ها:", error);
    existingDesigns.value = [];
  }
}

function generateUniqueName(baseName) {
  const isDuplicate = existingDesigns.value.some(d => d.name === baseName);
  if (!isDuplicate) {
    return baseName;
  }

  let counter = 1;
  let newName = `${baseName} (${counter})`;
  
  while (existingDesigns.value.some(d => d.name === newName)) {
    counter++;
    newName = `${baseName} (${counter})`;
  }
  
  return newName;
}

async function ensureUniqueName() {
  if (!name.value || !name.value.trim()) {
    name.value = generateUniqueName(DEFAULT_NAME);
    return;
  }

  const isDuplicate = existingDesigns.value.some(d => d.name === name.value);
  if (isDuplicate) {
    name.value = generateUniqueName(name.value);
  }
}

function downloadImage() {
  const link = document.createElement("a");
  link.href = preview.value;
  link.download = `${name.value || 'design'}.png`;
  link.click();
}

async function saveAndDownload() {
  if (saving.value) return;
  
  saving.value = true;

  try {
    await ensureUniqueName();

    const payload = {
      name: name.value,
      data: json.value,
      thumbnail_base64: preview.value,
      is_template: isTemplate.value,
    };

    const res = await designService.createDesign(payload);
    
    try {
      await designService.chargeSave(res.id);
    } catch (chargeError) {
      console.warn('خطا در کسر اعتبار:', chargeError);
    }

    downloadImage();
    sessionStorage.removeItem("pendingDesign");
    alert("✅ طرح با موفقیت ذخیره و دانلود شد");
    router.push("/dashboard");

  } catch (error) {
    console.error("خطا در ذخیره:", error);
    
    if (error.response?.status === 401) {
      alert("لطفاً دوباره وارد شوید");
      router.push('/login');
    } else if (error.response?.status === 402) {
      alert("موجودی کیف پول کافی نیست. لطفاً کیف پول خود را شارژ کنید.");
    } else {
      alert(error.response?.data?.detail || "خطا در ذخیره طرح");
    }
  } finally {
    saving.value = false;
  }
}

function cancel() {
  router.back();
}
</script>

<style scoped>
.finalize-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px 16px;
  min-height: 100vh;
}

.card-container {
  width: 100%;
  max-width: 960px;
  background: var(--bg);
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.3s ease;
}

.title {
  text-align: center;
  margin-bottom: 32px;
  font-size: 1.4rem;
  color: var(--text);
  font-weight: 700;
}

/* ========================================== */
/* Layout: تصویر چپ | فرم راست (دسکتاپ)       */
/* ========================================== */
.content-layout {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.preview-section {
  flex: 1;
  min-width: 0;
}

.preview-box {
  width: 100%;
  max-height: 500px;
  border-radius: 14px;
  overflow: auto;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-image {
  max-width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.form-section {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d0d0d0;
  outline: none;
  font-size: 15px;
  transition: 0.2s;
  background: var(--bg);
  color: var(--text);
}

.input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  text-align: center;
}

.btn.primary {
  background: #3b82f6;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.secondary {
  background: #f0f0f0;
  color: #333;
}

.btn.secondary:hover {
  background: #e0e0e0;
}

/* ========================================== */
/* Dark Mode                                  */
/* ========================================== */
:root {
  --bg: #ffffff;
  --text: #222222;
  --text-light: #555;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1c1c1e;
    --text: #ffffff;
    --text-light: #aaaaaa;
  }

  .card-container {
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  .preview-box {
    background: #2a2a2c;
    border-color: #444;
  }

  .input {
    background: #2a2a2c;
    border-color: #555;
    color: white;
  }

  .btn.secondary {
    background: #2f2f33;
    color: #ffffff;
  }
}

/* ========================================== */
/* ریسپانسیو - موبایل و تبلت                  */
/* ========================================== */
@media screen and (max-width: 768px) {
  .finalize-wrapper {
    padding: 16px 12px;
  }

  .card-container {
    padding: 20px 16px;
    max-width: 100%;
  }

  .content-layout {
    flex-direction: column;
  }

  .preview-section {
    width: 100%;
  }

  .preview-box {
    max-height: 350px;
  }

  .form-section {
    width: 100%;
  }

  .title {
    font-size: 1.2rem;
    margin-bottom: 20px;
  }
}

@media screen and (max-width: 480px) {
  .card-container {
    padding: 16px 12px;
  }

  .preview-box {
    max-height: 250px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
import { ref, onMounted, computed, watch } from "vue"; 
import Konva from "konva";
import designService from "../../../services/design.service";
import authService from "../../../services/auth.service.js"
import draggable from "vuedraggable";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from '../../../stores/auth'; // ← اضافه کنید
export default {
  components: {
    draggable
  },
  props: {
    designIdProp: {
      type: String,
      default: null
    }
  },
  setup(props) {
    const route = useRoute();
    const router = useRouter();// در setup():
    const authStore = useAuthStore();

    // Reactive state for responsive
    const mobileMenuOpen = ref(false);
    const sidebarOpen = ref(false);
    const layersCollapsed = ref(false);
    const floatingPanelOpen = ref(false);
    const mobileLayersExpanded = ref(true);

    const designName = ref("");
    const selectedTemplate = ref("");
    const layersList = ref([]);
    const activeLayer = ref(null);
    const selectedPlaceholder = ref("");

    const stageRef = ref(null);
    const layerRef = ref(null);
    const transformerRef = ref(null);

    const selectedNode = ref(null);
    const isText = computed(() => selectedNode.value?.className === "Text");
    const fillColor = ref("#000000");
    const fontSize = ref(28);
    const designId = ref(null);

    const user = ref(null);
    const isTemplate = ref(false);
    const isLoading = ref(false);
    const isAdmin = computed(() => user.value?.is_admin === true);
    const colorInput = ref(null);

    // Zoom refs
    const canvasArea = ref(null);
    const canvasScroll = ref(null);
    const zoomLevel = ref(1);
    const minZoom = 0.3;
    const maxZoom = 3;

    const userFields = [
      { key: "name", label: "نام کاربر" },
      { key: "phone_number", label: "شماره تماس" },
      { key: "email", label: "ایمیل" },
      { key: "address", label: "آدرس" },
      { key: "website", label: "وبسایت" }
    ];

    const canvasSizes = {
      business: { width: 900, height: 500 },
      instagram: { width: 1080, height: 1080 },
      story: { width: 1080, height: 1920 },
   
    };

    const selectedSize = ref("business");
    const width = ref(canvasSizes.business.width);
    const height = ref(canvasSizes.business.height);
// ==========================================
// در setup() اضافه کن
// ==========================================
const toastMessage = ref('')
const toastType = ref('success')
const toastVisible = ref(false)
let toastTimer = null

// ==========================================
// تابع showToast - اصلاح نهایی
// ==========================================
// 1. اصلاح showToast - ذخیره در sessionStorage
function showToast(message, type = 'success', duration = 4000) {
  // همیشه Toast را نمایش بده
  toastMessage.value = message;
  toastType.value = type;
  
  setTimeout(() => {
    toastVisible.value = true;
  }, 20);
  
  // اگر duration > 0 باشد، بعد از مدت مشخص مخفی کن
  if (duration > 0) {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastVisible.value = false;
    }, duration);
  }
  // اگر duration = 0 باشد، Toast را نمایش بده ولی مخفی نکن (loading)
  // اگر duration = -1 باشد، فقط در sessionStorage ذخیره کن (برای صفحه بعد)
  else if (duration === -1) {
    sessionStorage.setItem('pendingToast', JSON.stringify({
      message,
      type,
      timestamp: Date.now()
    }));
    toastVisible.value = false; // در همین صفحه نمایش نده
  }
}

    // Responsive methods
    function toggleMobileMenu() {
      mobileMenuOpen.value = !mobileMenuOpen.value;
    }

    function closeMobileMenu() {
      mobileMenuOpen.value = false;
    }

    function toggleLayers() {
      layersCollapsed.value = !layersCollapsed.value;
    }

    function closeSidebar() {
      sidebarOpen.value = false;
    }

function toggleMobileLayers() {
  mobileLayersExpanded.value = !mobileLayersExpanded.value;
  
  // صبر کنید تا DOM به‌روز شود سپس fit کنید
  setTimeout(() => {
    fitToScreen();
  }, 50);
}

    // Zoom functions
// تابع Fit to Screen - اصلاح شده برای موبایل
// تابع Fit to Screen - بهینه برای همه دستگاه‌ها
function fitToScreen() {
  if (!stageRef.value) return;

  const isMobile = window.innerWidth <= 768;

  if (!isMobile) {
    // 📱 دسکتاپ: محاسبه پویا با حاشیه ایمن
    const container = document.querySelector('.canvas-area');
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const canvasWidth = width.value;
    const canvasHeight = height.value;

    // فضای پنل لایه‌ها (در صورت وجود در حالت موبایل/تبلت)
    let extraHeight = 0;
    const layersPanel = document.querySelector('.mobile-layers-panel');
    if (layersPanel) extraHeight = layersPanel.clientHeight;

    const availableHeight = containerHeight - extraHeight;

    const scaleX = containerWidth / canvasWidth;
    const scaleY = availableHeight / canvasHeight;

    let scale = Math.min(scaleX, scaleY) * 0.9;
    scale = Math.max(scale, 0.25);
    scale = Math.min(scale, 1);

    zoomLevel.value = scale;
  } else {
    // 📱 موبایل: مقادیر ثابت دقیقاً مطابق درخواست شما
    const size = selectedSize.value;
    switch (size) {
      case 'business':
        zoomLevel.value = 0.27;   // کارت ویزیت
        break;
      case 'instagram':
        zoomLevel.value = 0.20;   // پست اینستاگرام
        break;
      case 'story':
        zoomLevel.value = 0.20;   // استوری
        break;
      default:
        zoomLevel.value = 0.25;   // پیش‌فرض ایمن
    }
  }

  applyZoom();
}

function applyZoom() {
  const canvasElement = document.getElementById("canvas");
  const scrollContainer = document.querySelector('.canvas-scroll');
  if (!canvasElement || !scrollContainer) return;
  
  const scale = zoomLevel.value;
  const canvasWidth = width.value;
  const canvasHeight = height.value;
  
  // 1. ایجاد یا دریافت wrapper
  let wrapper = document.getElementById("canvas-zoom-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.id = "canvas-zoom-wrapper";
    canvasElement.parentNode.insertBefore(wrapper, canvasElement);
    wrapper.appendChild(canvasElement);
  }
  
  // 2. تنظیم ابعاد wrapper برابر با ابعاد scaled
  const scaledWidth = canvasWidth * scale;
  const scaledHeight = canvasHeight * scale;
  wrapper.style.width = scaledWidth + 'px';
  wrapper.style.height = scaledHeight + 'px';
  wrapper.style.margin = '0 auto';
  wrapper.style.position = 'relative';
  
  // 3. تنظیم کانواس داخل wrapper
  canvasElement.style.width = canvasWidth + 'px';
  canvasElement.style.height = canvasHeight + 'px';
  canvasElement.style.transform = `scale(${scale})`;
  canvasElement.style.transformOrigin = '0 0';
  canvasElement.style.position = 'absolute';
  canvasElement.style.left = '0';
  canvasElement.style.top = '0';
  canvasElement.style.margin = '0';
  
  // 4. تنظیم کانتینر اسکرول
  scrollContainer.style.display = 'flex';
  scrollContainer.style.justifyContent = 'center';
  scrollContainer.style.alignItems = 'center';
}

function centerCanvasWithLeft() {
  const canvas = document.getElementById('canvas');
  const scrollContainer = document.querySelector('.canvas-scroll');
  if (!canvas || !scrollContainer) return;
  
  const containerWidth = scrollContainer.clientWidth;
  const canvasWidth = width.value * zoomLevel.value;
  
  // محاسبه left برای مرکز شدن
  const leftValue = (containerWidth - canvasWidth) / 2;
  canvas.style.position = 'relative';
  canvas.style.left = leftValue + 'px';
  canvas.style.margin = '0';
}

function zoomIn() {
  zoomLevel.value = Math.min(zoomLevel.value + 0.15, maxZoom);
  applyZoom();
}

function zoomOut() {
  zoomLevel.value = Math.max(zoomLevel.value - 0.15, minZoom);
  applyZoom();
}

    watch(selectedNode, (newVal) => {
      if (newVal && window.innerWidth <= 768) {
        floatingPanelOpen.value = true;
      }
    });

    function openColorPicker() {
      colorInput.value?.click();
    }

    function changeCanvasSize() {
  const size = canvasSizes[selectedSize.value];
  width.value = size.width;
  height.value = size.height;

  const container = document.getElementById("canvas");
  if (container) {
    container.style.width = width.value + "px";
    container.style.height = height.value + "px";
    container.style.transform = "scale(1)";
  }

  if (stageRef.value) {
    stageRef.value.size({
      width: width.value,
      height: height.value
    });
    stageRef.value.draw();
  }
  
  zoomLevel.value = 1;
  
  // تاخیر بیشتر
  setTimeout(() => {
    fitToScreen();
  }, 150);
}

    function applyPlaceholder() {
      if (!selectedNode.value) return;
      if (selectedNode.value.className !== "Text") return;

      const node = selectedNode.value;

      if (!selectedPlaceholder.value) {
        delete node.attrs.placeholder;
        layerRef.value.batchDraw();
        return;
      }

      node.attrs.placeholder = selectedPlaceholder.value;
      const field = userFields.find(f => f.key === selectedPlaceholder.value);
      node.text(field?.label || selectedPlaceholder.value);
      layerRef.value.batchDraw();
    }

    function getUserValue(key, user) {
      if (key === "name") {
        return `${user.first_name || ''} ${user.last_name || ''}`.trim();
      }
      return user[key] || "";
    }

    function applyUserData(stage, user) {
      stage.find("Text").forEach(node => {
        const placeholder = node.attrs.placeholder;
        if (!placeholder) return;
        const value = getUserValue(placeholder, user);
        if (value) {
          node.text(value);
        }
      });
    }

    function addToLayerList(node) {
      layersList.value.unshift({
        id: node._id,
        type: node.className,
        displayName: getNodeDisplayName(node)
      });
    }

    function getNodeDisplayName(node) {
      switch (node.className) {
        case "Text": return "🅣 متن";
        case "Rect": return "▭ مستطیل";
        case "Circle": return "⬤ دایره";
        case "Line": return "／ خط";
        case "RegularPolygon": return "▲ مثلث";
        case "Ellipse": return "⬭ بیضی";
        case "Star": return "★ ستاره";
        case "Image": return "🖼 تصویر";
        default: return "شیء";
      }
    }

   function handleLayerSelection(id) {
  const node = layerRef.value.findOne(n => n._id === id);
  if (node) {
    selectNode(node);
    activeLayer.value = id;
    
    if (window.innerWidth <= 768) {
      // در موبایل پنل شناور رو باز نکن، از quick-settings استفاده کن
      floatingPanelOpen.value = false;
      // اطمینان از باز بودن لایه‌ها
      mobileLayersExpanded.value = true;
    }
  }
}

    function removeLayer(id) {
      const node = layerRef.value.findOne(n => n._id === id);
      if (node) node.destroy();

      layersList.value = layersList.value.filter(l => l.id !== id);

      if (selectedNode.value?._id === id) {
        selectedNode.value = null;
        transformerRef.value.nodes([]);
        floatingPanelOpen.value = false;
      }

      layerRef.value.draw();
    }

    function onLayerDragEnd() {
      const nodes = layersList.value.map(layer =>
        layerRef.value.findOne(n => n._id === layer.id)
      );

      nodes.reverse().forEach((node, index) => {
        node.setZIndex(index);
      });

      layerRef.value.draw();
    }

    function createStage() {
      const container = document.getElementById("canvas");
      container.style.width = width.value + "px";
      container.style.height = height.value + "px";

      const stage = new Konva.Stage({
        container: "canvas",
        width: width.value,
        height: height.value
      });

      stageRef.value = stage;

      const layer = new Konva.Layer();
      stage.add(layer);
      layerRef.value = layer;

      const transformer = new Konva.Transformer();
      layer.add(transformer);
      transformerRef.value = transformer;

      stage.on("click", (e) => {
        if (e.target === stage || e.target.getParent()?.className === "Transformer") {
          transformerRef.value.nodes([]);
          selectedNode.value = null;
          activeLayer.value = null;
          floatingPanelOpen.value = false;
          return;
        }

        const node = e.target;
        selectNode(node);
        activeLayer.value = node._id;
      });

      setTimeout(() => {
        fitToScreen();
      }, 50);
    }

    function updateFill() {
      if (!selectedNode.value) return;

      if (selectedNode.value.className === "Line") {
        selectedNode.value.stroke(fillColor.value);
      } else {
        selectedNode.value.fill(fillColor.value);
      }

      layerRef.value.batchDraw();
    }

    function updateFont() {
      if (!selectedNode.value) return;
      selectedNode.value.fontSize(fontSize.value);
      layerRef.value.batchDraw();
    }

    function deleteNode() {
      if (!selectedNode.value) return;
      removeLayer(selectedNode.value._id);
      selectedNode.value.destroy();
      transformerRef.value.nodes([]);
      selectedNode.value = null;
      floatingPanelOpen.value = false;
      layerRef.value.batchDraw();
    }

    function enableTextResize(textNode) {
      textNode.on("transform", () => {
        const newWidth = textNode.width() * textNode.scaleX();
        textNode.width(newWidth);
        textNode.scaleX(1);
      });
    }

    function addText() {
      const text = new Konva.Text({
        text: "متن",
        x: 100,
        y: 100,
        width: 200,
        fontSize: 28,
        fill: "#000",
        draggable: true,
        wrap: "word",
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      enableTextEdit(text);
      enableTextResize(text);
      layerRef.value.add(text);
      addToLayerList(text);
      layerRef.value.batchDraw();
    }

    function addRect() {
      const rect = new Konva.Rect({
        x: 120,
        y: 120,
        width: 120,
        height: 80,
        fill: "blue",
        draggable: true,
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      layerRef.value.add(rect);
      addToLayerList(rect);
      layerRef.value.batchDraw();
    }

    function addCircle() {
      const circle = new Konva.Circle({
        x: 200,
        y: 200,
        radius: 50,
        fill: "red",
        draggable: true,
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      layerRef.value.add(circle);
      addToLayerList(circle);
      layerRef.value.batchDraw();
    }

    function addLine() {
      const line = new Konva.Line({
        points: [0, 0, 120, 0],
        stroke: "black",
        strokeWidth: 4,
        x: 150,
        y: 150,
        draggable: true,
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      layerRef.value.add(line);
      addToLayerList(line);
      layerRef.value.batchDraw();
    }

    function addTriangle() {
      const tri = new Konva.RegularPolygon({
        x: 250,
        y: 200,
        sides: 3,
        radius: 60,
        fill: "green",
        draggable: true,
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      layerRef.value.add(tri);
      addToLayerList(tri);
      layerRef.value.batchDraw();
    }

    function addEllipse() {
      const el = new Konva.Ellipse({
        x: 300,
        y: 200,
        radiusX: 80,
        radiusY: 40,
        fill: "purple",
        draggable: true,
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      layerRef.value.add(el);
      addToLayerList(el);
      layerRef.value.batchDraw();
    }

    function addStar() {
      const star = new Konva.Star({
        x: 400,
        y: 200,
        numPoints: 5,
        innerRadius: 30,
        outerRadius: 60,
        fill: "gold",
        draggable: true,
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      layerRef.value.add(star);
      addToLayerList(star);
      layerRef.value.batchDraw();
    }

function uploadImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();

    img.onload = () => {
      const konvaImg = new Konva.Image({
        image: img,
        x: 200,
        y: 200,
        draggable: true,
        _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
      });

      // ✅ ذخیره dataURL در attrs برای toJSON
      konvaImg.setAttr('dataURL', reader.result);
      
      layerRef.value.add(konvaImg);
      addToLayerList(konvaImg);
      layerRef.value.batchDraw();
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
}

    function enableTextEdit(textNode) {
      textNode.on("dblclick", () => {
        textNode.hide();
        transformerRef.value.hide();
        layerRef.value.draw();

        const stage = textNode.getStage();
        const container = stage.container().getBoundingClientRect();
        
        const nodePos = textNode.absolutePosition();
        const areaPosition = {
          x: container.left + nodePos.x,
          y: container.top + nodePos.y,
        };

        const textarea = document.createElement("textarea");
        document.body.appendChild(textarea);

        textarea.value = textNode.text();
        textarea.style.position = "absolute";
        textarea.style.top = areaPosition.y + "px";
        textarea.style.left = areaPosition.x + "px";
        textarea.style.width = textNode.width() * textNode.scaleX() + "px";
        textarea.style.height = textNode.height() * textNode.scaleY() + "px";
        textarea.style.fontSize = textNode.fontSize() * textNode.scaleX() + "px";
        textarea.style.border = "none";
        textarea.style.padding = "0px";
        textarea.style.margin = "0px";
        textarea.style.overflow = "hidden";
        textarea.style.background = "none";
        textarea.style.outline = "none";
        textarea.style.resize = "none";
        textarea.style.lineHeight = textNode.lineHeight();
        textarea.style.fontFamily = textNode.fontFamily();
        textarea.style.transformOrigin = "left top";
        textarea.style.textAlign = textNode.align();
        textarea.style.color = textNode.fill();
        
        const rotation = textNode.rotation();
        if (rotation) {
          textarea.style.transform = `rotateZ(${rotation}deg)`;
        }

        textarea.focus();

        textarea.addEventListener("input", () => {
          textNode.text(textarea.value);
          layerRef.value.batchDraw();
        });

        function removeTextarea() {
          textNode.text(textarea.value);
          textarea.parentNode.removeChild(textarea);
          window.removeEventListener("click", handleOutsideClick);
          textNode.show();
          transformerRef.value.show();
          transformerRef.value.forceUpdate();
          layerRef.value.draw();
        }

        textarea.addEventListener("keydown", (e) => {
          if (e.keyCode === 13 && !e.shiftKey) {
            removeTextarea();
          }
          if (e.keyCode === 27) {
            textarea.value = textNode.text();
            removeTextarea();
          }
        });

        function handleOutsideClick(e) {
          if (e.target !== textarea) {
            removeTextarea();
          }
        }

        setTimeout(() => {
          window.addEventListener("click", handleOutsideClick);
        });
      });
    }

function exportPNG() {
  if (!stageRef.value) {
    showToast('کانواس آماده نیست', 'error');
    return;
  }

  const layer = layerRef.value;
  
  // ساخت پس‌زمینه سفید
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: width.value,
    height: height.value,
    fill: "white"
  });

  layer.add(background);
  background.moveToBottom();
  layer.batchDraw();

  // ✅ صبر کنید تا تصاویر لود شوند
  setTimeout(() => {
    const dataURL = stageRef.value.toDataURL({ pixelRatio: 2 });
    
    background.destroy();
    layer.batchDraw();
    
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = `${designName.value || 'design'}.png`;
    a.click();
    
    // ✅ Toast را اینجا بگذار - بعد از دانلود
    showToast(' دانلود با موفقیت انجام شد', 'success', 4000);
  }, 500);
}

async function saveDesign() {
  if (!stageRef.value) {
    showToast('Stage آماده نیست', 'error');
    return;
  }

  const stage = stageRef.value;
  const layer = layerRef.value;

  // ساخت پس‌زمینه سفید موقت برای thumbnail
  const bg = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: "white"
  });

  layer.add(bg);
  bg.moveToBottom();
  layer.batchDraw();

  // گرفتن thumbnail جدید
  const thumbnailBase64 = stage.toDataURL({ 
    pixelRatio: 1.5,
    mimeType: 'image/png'
  });

  bg.destroy();
  layer.batchDraw();

  const jsonData = JSON.parse(stage.toJSON());

  const payload = {
    name: designName.value || 'طراحی جدید',
    data: jsonData,
    thumbnail_base64: thumbnailBase64,
    is_template: isTemplate.value
  };

  try {
    let res;

    // ✅ اگر designId وجود دارد → آپدیت (ویرایش)
    if (designId.value) {
      res = await designService.updateDesign(designId.value, payload);
      console.log('✅ Updated:', res);
      
      // ✅ ذخیره Toast برای نمایش در صفحه بعد (داشبورد)
      sessionStorage.setItem('pendingToast', JSON.stringify({
        message: ' طرح شما با موفقیت بروزرسانی شد',
        type: 'success',
        timestamp: Date.now()
      }));
      
      router.push('/dashboard');
      return;
    }

    // ✅ در غیر این صورت → ایجاد جدید
    res = await designService.createDesign(payload);
    console.log('✅ Created:', res);
    
    if (res.id) {
      designId.value = res.id;
      
      // ✅ کسر شارژ
      try {
        await designService.chargeSave(res.id);
      } catch (chargeError) {
        console.warn('خطا در کسر اعتبار:', chargeError);
      }
      
      // ✅ رفتن به مرحله نهایی (finalize)
      goToFinalize();
    }
    
  } catch (err) {
    console.error('Error:', err.response?.data || err);
    
    if (err.response?.status === 401) {
      showToast('لطفاً دوباره وارد شوید', 'error');
      router.push('/login');
    } else if (err.response?.status === 402) {
      showToast('موجودی کیف پول کافی نیست', 'error');
    } else {
      showToast('❌ خطا: ' + (err.response?.data?.detail || err.message), 'error');
    }
  }
}
    async function loadDesign(id, isTemplateMode = false) {
      try {
        const res = await designService.getDesign(id);
        const isEditMode = !isTemplateMode;

        if (isEditMode) {
          designId.value = res.data.id;
          designName.value = res.data.name;
          isTemplate.value = Boolean(res.data.is_template);
        } else {
          designId.value = null;
          isTemplate.value = false;
        }

        const dataJson = typeof res.data.data === "string"
          ? JSON.parse(res.data.data)
          : res.data.data;

        createStageFromJSON(dataJson);
        return res.data;

      } catch (err) {
        console.error(err);
        return null;
      }
    }



    function createStageFromJSON(json) {
  if (stageRef.value) {
    stageRef.value.destroy();
  }

  width.value = json.attrs.width;
  height.value = json.attrs.height;

  const container = document.getElementById("canvas");
  container.style.width = width.value + "px";
  container.style.height = height.value + "px";

  const stage = Konva.Node.create(json, "canvas");
  stageRef.value = stage;

  for (const key in canvasSizes) {
    const size = canvasSizes[key];
    if (size.width === width.value && size.height === height.value) {
      selectedSize.value = key;
    }
  }

  const layer = stage.getLayers()[0];
  layerRef.value = layer;

  const transformer = new Konva.Transformer();
  layer.add(transformer);
  transformerRef.value = transformer;

  layersList.value = [];

  const nodes = layer.getChildren().filter(n => n.className !== "Transformer");

  nodes.forEach(node => {
    if (!node._id) {
      node._id = new Date().getTime().toString() + Math.random().toString(36).substring(2, 5);
    }

    layersList.value.unshift({
      id: node._id,
      type: node.className,
      displayName: getNodeDisplayName(node)
    });

    if (node.className === "Text") {
      enableTextEdit(node);
      enableTextResize(node);
    }
    
    // ✅ لود تصاویر از dataURL
    if (node.className === "Image" && node.attrs.dataURL) {
      const img = new Image();
      img.onload = () => {
        node.image(img);
        layer.batchDraw();
      };
      img.src = node.attrs.dataURL;
    }
    
    node.draggable(true);
  });

  stage.on("click", (e) => {
    if (e.target === stage || e.target.getParent()?.className === "Transformer") {
      transformerRef.value.nodes([]);
      selectedNode.value = null;
      activeLayer.value = null;
      floatingPanelOpen.value = false;
      return;
    }

    const node = e.target;
    selectNode(node);
    activeLayer.value = node._id;
  });

  layer.batchDraw();
  
  setTimeout(() => {
    fitToScreen();
  }, 300);
}

    function selectNode(node) {
      selectedNode.value = node;
      transformerRef.value.nodes([node]);
      activeLayer.value = node._id;

      if (typeof node.fill === "function") {
        fillColor.value = node.fill() || "#000000";
      }
      
      if (node.className === "Text") {
        fontSize.value = node.fontSize();
        selectedPlaceholder.value = node.attrs.placeholder || "";
      } else {
        selectedPlaceholder.value = "";
      }
    }

    function goToFinalize() {
      if (!stageRef.value) {
        alert("canvas آماده نیست");
        return;
      }

      const jsonData = JSON.parse(stageRef.value.toJSON());

      const layer = layerRef.value;
      const stage = stageRef.value;

      const bg = new Konva.Rect({
        x: 0,
        y: 0,
        width: stage.width(),
        height: stage.height(),
        fill: "white",
      });

      layer.add(bg);
      bg.moveToBottom();
      layer.draw();

      const previewImage = stage.toDataURL({ pixelRatio: 2 });

      bg.destroy();
      layer.draw();

      sessionStorage.setItem(
        "pendingDesign",
        JSON.stringify({
          name: designName.value,
          json: jsonData,
          preview: previewImage,
          is_template: isTemplate.value,
        })
      );

      router.push("/editor/finalize");
    }

    

    onMounted(async () => {
  try {
    isLoading.value = true;
    createStage();

    const { data } = await authService.me();
    user.value = data;

    if (!props.designIdProp) {
      if (route.query.name) {
        designName.value = route.query.name;
      }

      if (route.query.template) {
        selectedTemplate.value = route.query.template;
        await loadDesign(route.query.template, true);
      }

      // تاخیر بیشتر
      setTimeout(() => {
        fitToScreen();
      }, 300);
      
      return;
    }

    const design = await loadDesign(props.designIdProp, false);

    if (design) {
      isTemplate.value = Boolean(design.is_template);

      if (!isTemplate.value) {
        applyUserData(stageRef.value, user.value);
      }
    }

    // تاخیر بیشتر
    setTimeout(() => {
      fitToScreen();
    }, 300);

  } catch (error) {
    console.error("Editor initialization error:", error);
  } finally {
    isLoading.value = false;
  }
});

// تابع آپلود PSD (ارسال به Backend Django)
// ==========================================

async function uploadPSD(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.name.toLowerCase().endsWith('.psd')) {
    showToast('لطفاً فایل PSD انتخاب کنید', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('psd_file', file);

  try {
    // alert('⏳ در حال آپلود و پردازش فایل PSD...');
    showToast('⏳ در حال آپلود و پردازش فایل PSD...', 'info', 0);

    const token = authStore.accessToken || localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    if (!token) {
      showToast('لطفاً ابتدا وارد شوید', 'info', 0);
      return;
    }

    const response = await fetch('/api/designs/upload-psd/', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`خطای ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ PSD Data:', data.width, 'x', data.height, 'Layers:', data.layers.length);
    
    // تنظیم ابعاد کانواس
    width.value = data.width;
    height.value = data.height;
    
    if (stageRef.value) {
      stageRef.value.destroy();
    }
    
    const container = document.getElementById("canvas");
    container.style.width = data.width + "px";
    container.style.height = data.height + "px";
    
    const newStage = new Konva.Stage({
      container: "canvas",
      width: data.width,
      height: data.height
    });
    
    stageRef.value = newStage;
    
    const newLayer = new Konva.Layer();
    newStage.add(newLayer);
    layerRef.value = newLayer;
    
    const transformer = new Konva.Transformer();
    newLayer.add(transformer);
    transformerRef.value = transformer;
    
    layersList.value = [];
    
    newStage.on("click", (e) => {
      if (e.target === newStage || e.target.getParent()?.className === "Transformer") {
        transformer.nodes([]);
        selectedNode.value = null;
        activeLayer.value = null;
        floatingPanelOpen.value = false;
        return;
      }
      const node = e.target;
      selectNode(node);
      activeLayer.value = node._id;
    });
    
    // ==========================================
    // جمع‌آوری همه لایه‌ها (بدون گروه - flat)
    // ==========================================
    const allLayers = [];
    
    function flatten(layers) {
      for (const layer of layers) {
        if (layer.children && layer.children.length > 0) {
          flatten(layer.children);
        } else {
          allLayers.push(layer);
        }
      }
    }
    
    flatten(data.layers);
    
    console.log('📋 Flat layers:', allLayers.length);
    
    // ==========================================
    // اضافه کردن لایه‌ها به ترتیب (اول = پایین‌ترین)
    // ==========================================
    let addedCount = 0;
    
    for (const layer of allLayers) {
      if (!layer.visible) continue;
      
      const id = Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      
      // لایه تصویری
      // لایه تصویری
    if (layer.image_base64) {
      try {
        const img = await loadImage(layer.image_base64);
        
        if (img && img.width > 0) {
          const konvaImg = new Konva.Image({
            image: img,
            x: layer.left || 0,
            y: layer.top || 0,
            width: layer.width || img.width,
            height: layer.height || img.height,
            opacity: layer.opacity !== undefined ? layer.opacity : 1,
            draggable: true,
            _id: id,
            name: layer.name || 'لایه'
          });
          
          // ✅ ذخیره dataURL برای toJSON
          konvaImg.setAttr('dataURL', layer.image_base64);
          
          newLayer.add(konvaImg);
          addToLayerList(konvaImg);
          addedCount++;
        }
      } catch (err) {
        console.warn('Failed:', layer.name, err);
      }
    }
      
      // لایه متنی
      if (layer.kind === 'type' && layer.text) {
        try {
          const text = new Konva.Text({
            text: layer.text,
            x: layer.left || 0,
            y: layer.top || 0,
            fontSize: layer.font_size || 24,
            fontFamily: layer.font_name || 'Arial',
            fill: layer.font_color || '#000000',
            opacity: layer.opacity !== undefined ? layer.opacity : 1,
            draggable: true,
            _id: id,
            name: layer.name || 'متن'
          });
          
          enableTextEdit(text);
          enableTextResize(text);
          
          newLayer.add(text);
          addToLayerList(text);
          addedCount++;
        } catch (err) {
          console.warn('Failed:', layer.name, err);
        }
      }
    }
    
    newLayer.batchDraw();
    
    setTimeout(() => {
      fitToScreen();
      newLayer.batchDraw();
    }, 300);
    
    showToast(`✅ ${addedCount} لایه بارگذاری شد`, 'info', 0);
    
  } catch (error) {
    console.error('Error:', error);
    alert('خطا: ' + error.message);
  }
  
  event.target.value = '';
}






// تابع loadImage (بدون تغییر)
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

    return {
      designId,
      layersList,
      activeLayer,
      selectedPlaceholder,
      selectedNode,
      fillColor,
      fontSize,
      designName,
      selectedSize,
      width,
      height,
      isTemplate,
      isAdmin,
      isText,
      user,
      addText,
      addRect,
      addCircle,
      addLine,
      addTriangle,
      addEllipse,
      addStar,
      uploadImage,
      exportPNG,
      saveDesign,
      changeCanvasSize,
      deleteNode,
      updateFill,
      updateFont,
      handleLayerSelection,
      toggleMobileLayers,
      removeLayer,
      onLayerDragEnd,
      applyPlaceholder,
      openColorPicker,
      colorInput,
      userFields,
      goToFinalize,
      mobileMenuOpen,
      sidebarOpen,
      layersCollapsed,
      floatingPanelOpen,
      mobileLayersExpanded,
      toggleMobileMenu,
      closeMobileMenu,
      toggleLayers,
      closeSidebar,
      canvasArea,
      canvasScroll,
      zoomLevel,
      zoomIn,
      zoomOut,
      fitToScreen,
      applyZoom,
      uploadPSD,
      toastMessage,
      toastType,
      toastVisible,
      showToast,
    };
  }
};


// import { ref, onMounted, computed, watch } from "vue"; 
// import Konva from "konva";
// import designService from "../../../services/design.service";
// import authService from "../../../services/auth.service.js"
// import draggable from "vuedraggable";
// import { useRoute, useRouter } from "vue-router";
// import axios from "axios";

// export default {
//   components: {
//     draggable
//   },
//   props: {
//     designIdProp: {
//       type: String,
//       default: null
//     }
//   },
//   setup(props) {
//     const route = useRoute();
//     const router = useRouter();

//     // Reactive state for responsive
//     const mobileMenuOpen = ref(false);
//     const sidebarOpen = ref(false);
//     const layersCollapsed = ref(false);
//     const floatingPanelOpen = ref(false);
//     const mobileLayersExpanded = ref(true);

//     const designName = ref("");
//     const selectedTemplate = ref("");
//     const layersList = ref([]);
//     const activeLayer = ref(null);
//     const selectedPlaceholder = ref("");

//     const stageRef = ref(null);
//     const layerRef = ref(null);
//     const transformerRef = ref(null);

//     const selectedNode = ref(null);
//     const isText = computed(() => selectedNode.value?.className === "Text");
//     const fillColor = ref("#000000");
//     const fontSize = ref(28);
//     const designId = ref(null);

//     const user = ref(null);
//     const isTemplate = ref(false);
//     const isLoading = ref(false);
//     const isAdmin = computed(() => user.value?.is_admin === true);
//     const colorInput = ref(null);

//     // Zoom refs
//     const canvasArea = ref(null);
//     const canvasScroll = ref(null);
//     const zoomLevel = ref(1);
//     const minZoom = 0.3;
//     const maxZoom = 3;

//     const userFields = [
//       { key: "name", label: "نام کاربر" },
//       { key: "phone_number", label: "شماره تماس" },
//       { key: "email", label: "ایمیل" },
//       { key: "address", label: "آدرس" },
//       { key: "website", label: "وبسایت" }
//     ];

//     const canvasSizes = {
//       business: { width: 900, height: 500 },
//       instagram: { width: 1080, height: 1080 },
//       story: { width: 1080, height: 1920 },
   
//     };

//     const selectedSize = ref("business");
//     const width = ref(canvasSizes.business.width);
//     const height = ref(canvasSizes.business.height);

//     // Responsive methods
//     function toggleMobileMenu() {
//       mobileMenuOpen.value = !mobileMenuOpen.value;
//     }

//     function closeMobileMenu() {
//       mobileMenuOpen.value = false;
//     }

//     function toggleLayers() {
//       layersCollapsed.value = !layersCollapsed.value;
//     }

//     function closeSidebar() {
//       sidebarOpen.value = false;
//     }

//     function toggleMobileLayers() {
//       mobileLayersExpanded.value = !mobileLayersExpanded.value;
//       setTimeout(() => { fitToScreen(); }, 50);
//     }

//     // Zoom functions
//     function fitToScreen() {
//       if (!stageRef.value) return;
//       const isMobile = window.innerWidth <= 768;
//       if (!isMobile) {
//         const container = document.querySelector('.canvas-area');
//         if (!container) return;
//         const containerWidth = container.clientWidth;
//         const containerHeight = container.clientHeight;
//         const canvasWidth = width.value;
//         const canvasHeight = height.value;
//         let extraHeight = 0;
//         const layersPanel = document.querySelector('.mobile-layers-panel');
//         if (layersPanel) extraHeight = layersPanel.clientHeight;
//         const availableHeight = containerHeight - extraHeight;
//         const scaleX = containerWidth / canvasWidth;
//         const scaleY = availableHeight / canvasHeight;
//         let scale = Math.min(scaleX, scaleY) * 0.9;
//         scale = Math.max(scale, 0.25);
//         scale = Math.min(scale, 1);
//         zoomLevel.value = scale;
//       } else {
//         const size = selectedSize.value;
//         switch (size) {
//           case 'business': zoomLevel.value = 0.27; break;
//           case 'instagram': zoomLevel.value = 0.20; break;
//           case 'story': zoomLevel.value = 0.20; break;
//           default: zoomLevel.value = 0.25;
//         }
//       }
//       applyZoom();
//     }

//     function applyZoom() {
//       const canvasElement = document.getElementById("canvas");
//       const scrollContainer = document.querySelector('.canvas-scroll');
//       if (!canvasElement || !scrollContainer) return;
//       const scale = zoomLevel.value;
//       const canvasWidth = width.value;
//       const canvasHeight = height.value;
//       let wrapper = document.getElementById("canvas-zoom-wrapper");
//       if (!wrapper) {
//         wrapper = document.createElement("div");
//         wrapper.id = "canvas-zoom-wrapper";
//         canvasElement.parentNode.insertBefore(wrapper, canvasElement);
//         wrapper.appendChild(canvasElement);
//       }
//       const scaledWidth = canvasWidth * scale;
//       const scaledHeight = canvasHeight * scale;
//       wrapper.style.width = scaledWidth + 'px';
//       wrapper.style.height = scaledHeight + 'px';
//       wrapper.style.margin = '0 auto';
//       wrapper.style.position = 'relative';
//       canvasElement.style.width = canvasWidth + 'px';
//       canvasElement.style.height = canvasHeight + 'px';
//       canvasElement.style.transform = `scale(${scale})`;
//       canvasElement.style.transformOrigin = '0 0';
//       canvasElement.style.position = 'absolute';
//       canvasElement.style.left = '0';
//       canvasElement.style.top = '0';
//       canvasElement.style.margin = '0';
//       scrollContainer.style.display = 'flex';
//       scrollContainer.style.justifyContent = 'center';
//       scrollContainer.style.alignItems = 'center';
//     }

//     function centerCanvasWithLeft() {
//       const canvas = document.getElementById('canvas');
//       const scrollContainer = document.querySelector('.canvas-scroll');
//       if (!canvas || !scrollContainer) return;
//       const containerWidth = scrollContainer.clientWidth;
//       const canvasWidth = width.value * zoomLevel.value;
//       const leftValue = (containerWidth - canvasWidth) / 2;
//       canvas.style.position = 'relative';
//       canvas.style.left = leftValue + 'px';
//       canvas.style.margin = '0';
//     }

//     function zoomIn() {
//       zoomLevel.value = Math.min(zoomLevel.value + 0.15, maxZoom);
//       applyZoom();
//     }

//     function zoomOut() {
//       zoomLevel.value = Math.max(zoomLevel.value - 0.15, minZoom);
//       applyZoom();
//     }

//     watch(selectedNode, (newVal) => {
//       if (newVal && window.innerWidth <= 768) {
//         floatingPanelOpen.value = true;
//       }
//     });

//     function openColorPicker() {
//       colorInput.value?.click();
//     }

//     function changeCanvasSize() {
//       const size = canvasSizes[selectedSize.value];
//       width.value = size.width;
//       height.value = size.height;
//       const container = document.getElementById("canvas");
//       if (container) {
//         container.style.width = width.value + "px";
//         container.style.height = height.value + "px";
//         container.style.transform = "scale(1)";
//       }
//       if (stageRef.value) {
//         stageRef.value.size({ width: width.value, height: height.value });
//         stageRef.value.draw();
//       }
//       zoomLevel.value = 1;
//       setTimeout(() => { fitToScreen(); }, 150);
//     }

//     function applyPlaceholder() {
//       if (!selectedNode.value) return;
//       if (selectedNode.value.className !== "Text") return;
//       const node = selectedNode.value;
//       if (!selectedPlaceholder.value) {
//         delete node.attrs.placeholder;
//         layerRef.value.batchDraw();
//         return;
//       }
//       node.attrs.placeholder = selectedPlaceholder.value;
//       const field = userFields.find(f => f.key === selectedPlaceholder.value);
//       node.text(field?.label || selectedPlaceholder.value);
//       layerRef.value.batchDraw();
//     }

//     function getUserValue(key, user) {
//       if (key === "name") {
//         return `${user.first_name || ''} ${user.last_name || ''}`.trim();
//       }
//       return user[key] || "";
//     }

//     function applyUserData(stage, user) {
//       stage.find("Text").forEach(node => {
//         const placeholder = node.attrs.placeholder;
//         if (!placeholder) return;
//         const value = getUserValue(placeholder, user);
//         if (value) { node.text(value); }
//       });
//     }

//     function addToLayerList(node) {
//       layersList.value.unshift({
//         id: node._id,
//         type: node.className,
//         displayName: getNodeDisplayName(node)
//       });
//     }

//     function getNodeDisplayName(node) {
//       switch (node.className) {
//         case "Text": return "🅣 متن";
//         case "Rect": return "▭ مستطیل";
//         case "Circle": return "⬤ دایره";
//         case "Line": return "／ خط";
//         case "RegularPolygon": return "▲ مثلث";
//         case "Ellipse": return "⬭ بیضی";
//         case "Star": return "★ ستاره";
//         case "Image": return "🖼 تصویر";
//         default: return "شیء";
//       }
//     }

//     function handleLayerSelection(id) {
//       const node = layerRef.value.findOne(n => n._id === id);
//       if (node) {
//         selectNode(node);
//         activeLayer.value = id;
//         if (window.innerWidth <= 768) {
//           floatingPanelOpen.value = false;
//           mobileLayersExpanded.value = true;
//         }
//       }
//     }

//     function removeLayer(id) {
//       const node = layerRef.value.findOne(n => n._id === id);
//       if (node) node.destroy();
//       layersList.value = layersList.value.filter(l => l.id !== id);
//       if (selectedNode.value?._id === id) {
//         selectedNode.value = null;
//         transformerRef.value.nodes([]);
//         floatingPanelOpen.value = false;
//       }
//       layerRef.value.draw();
//     }

//     function onLayerDragEnd() {
//       const nodes = layersList.value.map(layer => layerRef.value.findOne(n => n._id === layer.id));
//       nodes.reverse().forEach((node, index) => { node.setZIndex(index); });
//       layerRef.value.draw();
//     }

//     function createStage() {
//       const container = document.getElementById("canvas");
//       container.style.width = width.value + "px";
//       container.style.height = height.value + "px";
//       const stage = new Konva.Stage({ container: "canvas", width: width.value, height: height.value });
//       stageRef.value = stage;
//       const layer = new Konva.Layer();
//       stage.add(layer);
//       layerRef.value = layer;
//       const transformer = new Konva.Transformer();
//       layer.add(transformer);
//       transformerRef.value = transformer;
//       stage.on("click", (e) => {
//         if (e.target === stage || e.target.getParent()?.className === "Transformer") {
//           transformerRef.value.nodes([]);
//           selectedNode.value = null;
//           activeLayer.value = null;
//           floatingPanelOpen.value = false;
//           return;
//         }
//         const node = e.target;
//         selectNode(node);
//         activeLayer.value = node._id;
//       });
//       setTimeout(() => { fitToScreen(); }, 50);
//     }

//     function updateFill() {
//       if (!selectedNode.value) return;
//       if (selectedNode.value.className === "Line") {
//         selectedNode.value.stroke(fillColor.value);
//       } else {
//         selectedNode.value.fill(fillColor.value);
//       }
//       layerRef.value.batchDraw();
//     }

//     function updateFont() {
//       if (!selectedNode.value) return;
//       selectedNode.value.fontSize(fontSize.value);
//       layerRef.value.batchDraw();
//     }

//     function deleteNode() {
//       if (!selectedNode.value) return;
//       removeLayer(selectedNode.value._id);
//       selectedNode.value.destroy();
//       transformerRef.value.nodes([]);
//       selectedNode.value = null;
//       floatingPanelOpen.value = false;
//       layerRef.value.batchDraw();
//     }

//     function enableTextResize(textNode) {
//       textNode.on("transform", () => {
//         const newWidth = textNode.width() * textNode.scaleX();
//         textNode.width(newWidth);
//         textNode.scaleX(1);
//       });
//     }

//     function addText() {
//       const text = new Konva.Text({
//         text: "متن", x: 100, y: 100, width: 200, fontSize: 28, fill: "#000",
//         draggable: true, wrap: "word",
//         _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//       });
//       enableTextEdit(text);
//       enableTextResize(text);
//       layerRef.value.add(text);
//       addToLayerList(text);
//       layerRef.value.batchDraw();
//     }

//     function addRect() {
//       const rect = new Konva.Rect({
//         x: 120, y: 120, width: 120, height: 80, fill: "blue", draggable: true,
//         _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//       });
//       layerRef.value.add(rect);
//       addToLayerList(rect);
//       layerRef.value.batchDraw();
//     }

//     function addCircle() {
//       const circle = new Konva.Circle({
//         x: 200, y: 200, radius: 50, fill: "red", draggable: true,
//         _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//       });
//       layerRef.value.add(circle);
//       addToLayerList(circle);
//       layerRef.value.batchDraw();
//     }

//     function addLine() {
//       const line = new Konva.Line({
//         points: [0, 0, 120, 0], stroke: "black", strokeWidth: 4, x: 150, y: 150, draggable: true,
//         _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//       });
//       layerRef.value.add(line);
//       addToLayerList(line);
//       layerRef.value.batchDraw();
//     }

//     function addTriangle() {
//       const tri = new Konva.RegularPolygon({
//         x: 250, y: 200, sides: 3, radius: 60, fill: "green", draggable: true,
//         _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//       });
//       layerRef.value.add(tri);
//       addToLayerList(tri);
//       layerRef.value.batchDraw();
//     }

//     function addEllipse() {
//       const el = new Konva.Ellipse({
//         x: 300, y: 200, radiusX: 80, radiusY: 40, fill: "purple", draggable: true,
//         _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//       });
//       layerRef.value.add(el);
//       addToLayerList(el);
//       layerRef.value.batchDraw();
//     }

//     function addStar() {
//       const star = new Konva.Star({
//         x: 400, y: 200, numPoints: 5, innerRadius: 30, outerRadius: 60, fill: "gold", draggable: true,
//         _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//       });
//       layerRef.value.add(star);
//       addToLayerList(star);
//       layerRef.value.batchDraw();
//     }

//     function uploadImage(e) {
//       const file = e.target.files[0];
//       if (!file) return;
//       const reader = new FileReader();
//       reader.onload = () => {
//         const img = new Image();
//         img.onload = () => {
//           const konvaImg = new Konva.Image({
//             image: img, x: 200, y: 200, draggable: true,
//             _id: new Date().getTime().toString() + Math.random().toString(36).substring(2, 5)
//           });
//           layerRef.value.add(konvaImg);
//           addToLayerList(konvaImg);
//           layerRef.value.batchDraw();
//         };
//         img.src = reader.result;
//       };
//       reader.readAsDataURL(file);
//     }

//     function enableTextEdit(textNode) {
//       textNode.on("dblclick", () => {
//         textNode.hide();
//         transformerRef.value.hide();
//         layerRef.value.draw();
//         const stage = textNode.getStage();
//         const container = stage.container().getBoundingClientRect();
//         const nodePos = textNode.absolutePosition();
//         const areaPosition = { x: container.left + nodePos.x, y: container.top + nodePos.y };
//         const textarea = document.createElement("textarea");
//         document.body.appendChild(textarea);
//         textarea.value = textNode.text();
//         textarea.style.position = "absolute";
//         textarea.style.top = areaPosition.y + "px";
//         textarea.style.left = areaPosition.x + "px";
//         textarea.style.width = textNode.width() * textNode.scaleX() + "px";
//         textarea.style.height = textNode.height() * textNode.scaleY() + "px";
//         textarea.style.fontSize = textNode.fontSize() * textNode.scaleX() + "px";
//         textarea.style.border = "none";
//         textarea.style.padding = "0px";
//         textarea.style.margin = "0px";
//         textarea.style.overflow = "hidden";
//         textarea.style.background = "none";
//         textarea.style.outline = "none";
//         textarea.style.resize = "none";
//         textarea.style.lineHeight = textNode.lineHeight();
//         textarea.style.fontFamily = textNode.fontFamily();
//         textarea.style.transformOrigin = "left top";
//         textarea.style.textAlign = textNode.align();
//         textarea.style.color = textNode.fill();
//         const rotation = textNode.rotation();
//         if (rotation) { textarea.style.transform = `rotateZ(${rotation}deg)`; }
//         textarea.focus();
//         textarea.addEventListener("input", () => { textNode.text(textarea.value); layerRef.value.batchDraw(); });
//         function removeTextarea() {
//           textNode.text(textarea.value);
//           textarea.parentNode.removeChild(textarea);
//           window.removeEventListener("click", handleOutsideClick);
//           textNode.show();
//           transformerRef.value.show();
//           transformerRef.value.forceUpdate();
//           layerRef.value.draw();
//         }
//         textarea.addEventListener("keydown", (e) => {
//           if (e.keyCode === 13 && !e.shiftKey) { removeTextarea(); }
//           if (e.keyCode === 27) { textarea.value = textNode.text(); removeTextarea(); }
//         });
//         function handleOutsideClick(e) { if (e.target !== textarea) { removeTextarea(); } }
//         setTimeout(() => { window.addEventListener("click", handleOutsideClick); });
//       });
//     }

//     function exportPNG() {
//       if (!stageRef.value) { alert("کانواس آماده نیست"); return; }
//       const layer = layerRef.value;
//       const background = new Konva.Rect({ x: 0, y: 0, width: width.value, height: height.value, fill: "white" });
//       layer.add(background);
//       background.moveToBottom();
//       layer.batchDraw();
//       const dataURL = stageRef.value.toDataURL({ pixelRatio: 2 });
//       background.destroy();
//       layer.batchDraw();
//       const a = document.createElement("a");
//       a.href = dataURL;
//       a.download = `${designName.value || 'design'}.png`;
//       a.click();
//     }

//     async function saveDesign() {
//       if (!stageRef.value) { alert("Stage آماده نیست"); return; }
//       const stage = stageRef.value;
//       const layer = layerRef.value;
//       const bg = new Konva.Rect({ x: 0, y: 0, width: stage.width(), height: stage.height(), fill: "white" });
//       layer.add(bg);
//       bg.moveToBottom();
//       layer.batchDraw();
//       const thumbnailBase64 = stage.toDataURL({ pixelRatio: 1.5, mimeType: 'image/png' });
//       bg.destroy();
//       layer.batchDraw();
//       const jsonData = JSON.parse(stage.toJSON());
//       const payload = { name: designName.value || 'طراحی جدید', data: jsonData, thumbnail_base64: thumbnailBase64, is_template: isTemplate.value };
//       try {
//         if (designId.value) {
//           const res = await designService.updateDesign(designId.value, payload);
//           console.log('✅ Updated with new thumbnail:', res);
//           alert("✅ طرح شما بروزرسانی شد");
//           router.push('/dashboard');
//         }
//       } catch (err) { console.error('Error:', err.response?.data); alert(JSON.stringify(err.response?.data)); }
//     }

//     async function loadDesign(id, isTemplateMode = false) {
//       try {
//         const res = await designService.getDesign(id);
//         const isEditMode = !isTemplateMode;
//         if (isEditMode) {
//           designId.value = res.data.id;
//           designName.value = res.data.name;
//           isTemplate.value = Boolean(res.data.is_template);
//         } else {
//           designId.value = null;
//           isTemplate.value = false;
//         }
//         const dataJson = typeof res.data.data === "string" ? JSON.parse(res.data.data) : res.data.data;
//         createStageFromJSON(dataJson);
//         return res.data;
//       } catch (err) { console.error(err); return null; }
//     }

//     function createStageFromJSON(json) {
//       if (stageRef.value) { stageRef.value.destroy(); }
//       width.value = json.attrs.width;
//       height.value = json.attrs.height;
//       const container = document.getElementById("canvas");
//       container.style.width = width.value + "px";
//       container.style.height = height.value + "px";
//       const stage = Konva.Node.create(json, "canvas");
//       stageRef.value = stage;
//       for (const key in canvasSizes) {
//         const size = canvasSizes[key];
//         if (size.width === width.value && size.height === height.value) { selectedSize.value = key; }
//       }
//       const layer = stage.getLayers()[0];
//       layerRef.value = layer;
//       const transformer = new Konva.Transformer();
//       layer.add(transformer);
//       transformerRef.value = transformer;
//       layersList.value = [];
//       const nodes = layer.getChildren().filter(n => n.className !== "Transformer");
//       nodes.forEach(node => {
//         if (!node._id) { node._id = new Date().getTime().toString() + Math.random().toString(36).substring(2, 5); }
//         layersList.value.unshift({ id: node._id, type: node.className, displayName: getNodeDisplayName(node) });
//         if (node.className === "Text") { enableTextEdit(node); enableTextResize(node); }
//       });
//       stage.on("click", (e) => {
//         if (e.target === stage || e.target.getParent()?.className === "Transformer") {
//           transformerRef.value.nodes([]);
//           selectedNode.value = null;
//           activeLayer.value = null;
//           floatingPanelOpen.value = false;
//           return;
//         }
//         const node = e.target;
//         selectNode(node);
//         activeLayer.value = node._id;
//       });
//       layer.batchDraw();
//       setTimeout(() => { fitToScreen(); }, 100);
//     }

//     function selectNode(node) {
//       selectedNode.value = node;
//       transformerRef.value.nodes([node]);
//       activeLayer.value = node._id;
//       if (typeof node.fill === "function") { fillColor.value = node.fill() || "#000000"; }
//       if (node.className === "Text") {
//         fontSize.value = node.fontSize();
//         selectedPlaceholder.value = node.attrs.placeholder || "";
//       } else { selectedPlaceholder.value = ""; }
//     }

//     function goToFinalize() {
//       if (!stageRef.value) { alert("canvas آماده نیست"); return; }
//       const jsonData = JSON.parse(stageRef.value.toJSON());
//       const layer = layerRef.value;
//       const stage = stageRef.value;
//       const bg = new Konva.Rect({ x: 0, y: 0, width: stage.width(), height: stage.height(), fill: "white" });
//       layer.add(bg);
//       bg.moveToBottom();
//       layer.draw();
//       const previewImage = stage.toDataURL({ pixelRatio: 2 });
//       bg.destroy();
//       layer.draw();
//       sessionStorage.setItem("pendingDesign", JSON.stringify({ name: designName.value, json: jsonData, preview: previewImage, is_template: isTemplate.value }));
//       router.push("/editor/finalize");
//     }

//     // ==========================================
//     // تابع آپلود PSD (ارسال به Backend Django)
//     // ==========================================
// async function uploadPSD(event) {
//   const file = event.target.files[0];
//   if (!file) return;

//   console.log('📁 File:', file.name, (file.size / 1024 / 1024).toFixed(2) + 'MB');

//   const token = localStorage.getItem('access_token');
//   console.log('🔑 Token exists:', !!token);

//   const formData = new FormData();
//   formData.append('psd_file', file);

//   try {
//     // استفاده از fetch با timeout
//     const controller = new AbortController();
//     const timeoutId = setTimeout(() => controller.abort(), 120000); // ۲ دقیقه

//     const response = await fetch('/api/designs/upload-psd/', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${token}`
//       },
//       body: formData,
//       signal: controller.signal
//     });

//     clearTimeout(timeoutId);

//     console.log('📡 Response status:', response.status);
    
//     if (response.ok) {
//       const data = await response.json();
//       console.log('✅ Success:', data);
//       alert('✅ فایل PSD با موفقیت آپلود شد');
//     } else {
//       const error = await response.json();
//       console.error('❌ Error:', error);
//       alert('❌ خطا: ' + (error.error || error.detail || 'نامشخص'));
//     }
//   } catch (error) {
//     if (error.name === 'AbortError') {
//       console.error('❌ Timeout: آپلود بیش از حد طول کشید');
//       alert('❌ آپلود بیش از حد طول کشید. فایل را کوچکتر کنید.');
//     } else {
//       console.error('❌ Network Error:', error);
//       alert('❌ خطای شبکه: ' + error.message);
//     }
//   }
  
//   event.target.value = '';
// }

//     async function addPSDLayerToCanvas(layer, parentX = 0, parentY = 0) {
//       if (!layer.visible) return;
//       const left = (layer.left || 0) + parentX;
//       const top = (layer.top || 0) + parentY;
//       const id = Date.now() + '_' + Math.random().toString(36).substring(2, 10);
//       if (layer.children && layer.children.length > 0) {
//         for (const child of layer.children) { await addPSDLayerToCanvas(child, left, top); }
//         return;
//       }
//       if (layer.image_base64) {
//         const img = new Image();
//         img.src = layer.image_base64;
//         await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
//         if (img.width > 0) {
//           const konvaImg = new Konva.Image({
//             image: img, x: left, y: top, width: layer.width, height: layer.height,
//             opacity: layer.opacity || 1, draggable: true, _id: id, name: layer.name || 'لایه'
//           });
//           layerRef.value.add(konvaImg);
//           addToLayerList(konvaImg);
//         }
//       }
//       if (layer.kind === 'type' && layer.text) {
//         const text = new Konva.Text({
//           text: layer.text, x: left, y: top, fontSize: layer.font_size || 24,
//           fontFamily: layer.font_name || 'Arial', fill: layer.font_color || '#000000',
//           opacity: layer.opacity || 1, draggable: true, _id: id, name: layer.name || 'متن'
//         });
//         enableTextEdit(text);
//         enableTextResize(text);
//         layerRef.value.add(text);
//         addToLayerList(text);
//       }
//     }

//     onMounted(async () => {
//       try {
//         isLoading.value = true;
//         createStage();
//         const { data } = await authService.me();
//         user.value = data;
//         if (!props.designIdProp) {
//           if (route.query.name) { designName.value = route.query.name; }
//           if (route.query.template) { selectedTemplate.value = route.query.template; await loadDesign(route.query.template, true); }
//           setTimeout(() => { fitToScreen(); }, 300);
//           return;
//         }
//         const design = await loadDesign(props.designIdProp, false);
//         if (design) {
//           isTemplate.value = Boolean(design.is_template);
//           if (!isTemplate.value) { applyUserData(stageRef.value, user.value); }
//         }
//         setTimeout(() => { fitToScreen(); }, 300);
//       } catch (error) { console.error("Editor initialization error:", error); }
//       finally { isLoading.value = false; }
//     });

//     return {
//       designId, layersList, activeLayer, selectedPlaceholder, selectedNode, fillColor, fontSize,
//       designName, selectedSize, width, height, isTemplate, isAdmin, isText, user,
//       addText, addRect, addCircle, addLine, addTriangle, addEllipse, addStar, uploadImage,
//       uploadPSD, exportPNG, saveDesign, changeCanvasSize, deleteNode, updateFill, updateFont,
//       handleLayerSelection, toggleMobileLayers, removeLayer, onLayerDragEnd, applyPlaceholder,
//       openColorPicker, colorInput, userFields, goToFinalize, mobileMenuOpen, sidebarOpen,
//       layersCollapsed, floatingPanelOpen, mobileLayersExpanded, toggleMobileMenu, closeMobileMenu,
//       toggleLayers, closeSidebar, canvasArea, canvasScroll, zoomLevel, zoomIn, zoomOut, fitToScreen, applyZoom,
//     };
//   }
// };
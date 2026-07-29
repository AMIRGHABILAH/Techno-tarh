
import { ref, onMounted, computed } from "vue";
import Konva from "konva";
import designService from "../../../services/design.service";
import authService from "../../../services/auth.service.js"
import draggable from "vuedraggable";
import { useRoute } from "vue-router";



export default {

  components:{
    draggable
  },

  props:{
    designIdProp:{
      type:String,
      default:null
    }
  },

setup(props){

  const route = useRoute();

  const designName = ref("")
  const selectedTemplate = ref("")

  const layersList = ref([])
  const activeLayer = ref(null)
  const selectedPlaceholder = ref("")


const stageRef = ref(null);
const layerRef = ref(null);
const transformerRef = ref(null);

const selectedNode = ref(null);
const isText = computed(() => selectedNode.value?.className === "Text");
const fillColor = ref("#000000");
const fontSize = ref(28);

const designId = ref(null);




// const props = defineProps({
//   designIdProp: {
//     type: String,
//     default: null
//   }
// });

const user = ref(null)
const isTemplate = ref(false)
const isLoading = ref(false)

const isAdmin = computed(() => user.value?.is_admin === true)
const colorInput = ref(null);


const userFields = [
  { key: "name", label: "نام کاربر" },
  { key: "phone_number", label: "شماره تماس" },
  { key: "email", label: "ایمیل" },
  { key: "address", label: "آدرس" },
  { key: "website", label: "وبسایت" }
]


function openColorPicker() {
  colorInput.value.click();
}

const canvasSizes = {
  business: { width: 900, height: 500 },
  instagram: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  banner: { width: 1200, height: 628 }
}

const selectedSize = ref("business")

const width = ref(canvasSizes.business.width)
const height = ref(canvasSizes.business.height)

function changeCanvasSize() {

  const size = canvasSizes[selectedSize.value]

  width.value = size.width
  height.value = size.height

  const container = document.getElementById("canvas")

  if (container) {
    container.style.width = width.value + "px"
    container.style.height = height.value + "px"
  }

  if (stageRef.value) {
    stageRef.value.size({
      width: width.value,
      height: height.value
    })

    stageRef.value.draw()
  }
}



function applyPlaceholder() {

  if (!selectedNode.value) return
  if (selectedNode.value.className !== "Text") return

  const node = selectedNode.value

  // اگر متن معمولی انتخاب شد
  if (!selectedPlaceholder.value) {

    delete node.attrs.placeholder

    // ✅ متن کاربر حفظ می‌شود
    layerRef.value.batchDraw()

    return
  }

  // اگر placeholder انتخاب شد
  node.attrs.placeholder = selectedPlaceholder.value

  const field = userFields.find(f => f.key === selectedPlaceholder.value)

  // نمایش label placeholder
  node.text(field?.label || selectedPlaceholder.value)

  layerRef.value.batchDraw()
}


function getUserValue(key, user) {

  if (key === "name") {
    return `${user.first_name} ${user.last_name}`.trim()
  }

  return user[key] || ""

}

function applyUserData(stage, user) {

  stage.find("Text").forEach(node => {

    const placeholder = node.attrs.placeholder

    if (!placeholder) return

    const value = getUserValue(placeholder, user)

    if (value) {
      node.text(value)
    }

  })

}


onMounted(async () => {
  try {
    isLoading.value = true;

    createStage();

    const { data } = await authService.me();
    user.value = data;

    // -------------------------------
    // حالت NEW DESIGN (new from home)
    // -------------------------------
    if (!props.designIdProp) {

      // نام ورودی از Home
      if (route.query.name) {
        designName.value = route.query.name;
      }

      // اگر Template انتخاب شده
      if (route.query.template) {
        selectedTemplate.value = route.query.template;

        // ⭐ مهم‌ترین بخش
        await loadDesign(route.query.template, true);
      }

      return;
    }

    // -------------------------------
    // حالت EDIT DESIGN
    // -------------------------------
    const design = await loadDesign(props.designIdProp, false);

    if (design) {
      isTemplate.value = Boolean(design.is_template);

      if (!isTemplate.value) {
        applyUserData(stageRef.value, user.value);
      }
    }

  } catch (error) {
    console.error("Editor initialization error:", error);
  } finally {
    isLoading.value = false;
  }
});




/* ---------------------- Layer Management (جدید) ---------------------- */

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

// *** نام تابع برای جلوگیری از تکرار تغییر کرد (از selectLayer به handleLayerSelection) ***
function handleLayerSelection(id) {
  const node = layerRef.value.findOne(n => n._id === id);
  if (node) {
    selectNode(node);
    activeLayer.value = id;
  }
}

function removeLayer(id) {
  const node = layerRef.value.findOne(n => n._id === id);
  if (node) node.destroy();

  layersList.value = layersList.value.filter(l => l.id !== id);

  if (selectedNode.value?._id === id) {
    selectedNode.value = null;
    transformerRef.value.nodes([]);
  }

  layerRef.value.draw();
}

function moveLayerUp(id) {
  const node = layerRef.value.findOne(n => n._id === id);
  if (!node) return;

  node.moveUp();
  layerRef.value.draw();

  reorderLayersList();
}

function moveLayerDown(id) {
  const node = layerRef.value.findOne(n => n._id === id);
  if (!node) return;

  node.moveDown();
  layerRef.value.draw();

  reorderLayersList();
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

function reorderLayersList() {
  const nodes = layerRef.value.getChildren().filter(n => n.className !== "Transformer");

  layersList.value = nodes
    .toArray()
    .reverse() // مهم: بالایی‌ها در لیست اول نمایش داده شوند
    .map(n => ({
      id: n._id,
      type: n.className,
      displayName: getNodeDisplayName(n)
    }));
}

/* ---------------------- Stage & Selection ---------------------- */

function createStage() {

  const container = document.getElementById("canvas")

  container.style.width = width.value + "px"
  container.style.height = height.value + "px"

  const stage = new Konva.Stage({
    container: "canvas",
    width: width.value,
    height: height.value
  })

  stageRef.value = stage

  const layer = new Konva.Layer()
  stage.add(layer)
  layerRef.value = layer

  const transformer = new Konva.Transformer()
  layer.add(transformer)
  transformerRef.value = transformer
stage.on("click", (e) => {

  if (e.target === stage || e.target.getParent()?.className === "Transformer") {
    transformerRef.value.nodes([]);
    selectedNode.value = null;
    activeLayer.value = null;
    return;
  }

  const node = e.target;

  selectNode(node);
  activeLayer.value = node._id;

});


}








/* ---------------------- Update ---------------------- */

function updateFill() {
  if (!selectedNode.value) return;

  // اگر شکل خط است از stroke تغییر رنگ بده
  if (selectedNode.value.className === "Line") {
    selectedNode.value.stroke(fillColor.value);
  } else {
    // بقیه اشکال با fill تغییر رنگ می‌دهند
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

  // حذف از لیست لایه‌ها
  removeLayer(selectedNode.value._id);

  selectedNode.value.destroy();
  transformerRef.value.nodes([]);
  selectedNode.value = null;

  layerRef.value.batchDraw();
}


function enableTextResize(textNode) {

  textNode.on("transform", () => {

    const newWidth = textNode.width() * textNode.scaleX();

    textNode.width(newWidth);
    textNode.scaleX(1);

  });

}


/* ---------------------- Shapes ---------------------- */

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
  enableTextResize(text);   // ✅ این خط

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


/* ---------------------- Image Upload ---------------------- */

function uploadImage(e) {
  const file = e.target.files[0];
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

      layerRef.value.add(konvaImg);
      addToLayerList(konvaImg);

      layerRef.value.batchDraw();
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
}


/* ---------------------- Text Editing (بهینه‌سازی شده) ---------------------- */

function enableTextEdit(textNode) {
  textNode.on("dblclick", () => {
    // ۱. مخفی کردن موقت متن اصلی روی بوم
    textNode.hide();
    transformerRef.value.hide();
    layerRef.value.draw();

    // ۲. پیدا کردن موقعیت دقیق متن نسبت به صفحه
    const stage = textNode.getStage();
    const container = stage.container().getBoundingClientRect();
    
    const nodePos = textNode.absolutePosition();
    const areaPosition = {
      x: container.left + nodePos.x,
      y: container.top + nodePos.y,
    };

    // ۳. ساختن یک Textarea موقت روی صفحه
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    // ۴. کپی کردن دقیق استایل‌های متن به Textarea
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
    
    // هماهنگی با چرخش متن (Rotation)
    const rotation = textNode.rotation();
    let transform = "";
    if (rotation) {
      transform += `rotateZ(${rotation}deg)`;
    }
    textarea.style.transform = transform;

    textarea.focus();

    // ۵. آپدیت همزمان متن هنگام تایپ
    textarea.addEventListener("input", () => {
      textNode.text(textarea.value);
      layerRef.value.batchDraw();
    });

    // ۶. پایان ویرایش (وقتی کاربر بیرون کلیک می‌کند یا Enter می‌زند)
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
      // اگر Enter زد و Shift نگرفته بود، تایید شود
      if (e.keyCode === 13 && !e.shiftKey) {
        removeTextarea();
      }
      // اگر Escape زد، کنسل شود (اختیاری)
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

    // با کمی تاخیر Event لیسنر را اضافه می‌کنیم تا با کلیک فعلی تداخل نکند
    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
    });
  });
}



/* ---------------------- Export ---------------------- */

function exportPNG() {

  const layer = layerRef.value;

  // ساخت پس‌زمینه سفید
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: width.value,
    height: height.value,

    fill: "white"
  });

  // اضافه کردن به ابتدای لایه
  layer.add(background);
  background.moveToBottom();

  layer.batchDraw();

  const dataURL = stageRef.value.toDataURL({
    pixelRatio: 2
  });

  // حذف پس زمینه بعد از export
  background.destroy();
  layer.batchDraw();

  const a = document.createElement("a");
  a.href = dataURL;
  a.download = "card.png";
  a.click();
}


/* ---------------------- Save (Using axios Service) ---------------------- */

// async function saveDesign() {
//   if (!stageRef.value) {
//     alert("Stage آماده نیست");
//     return;
//   }

//   // --------------------------
//   // 1. گرفتن داده JSON طراحی
//   // --------------------------
//   const json = JSON.parse(stageRef.value.toJSON());

//   // --------------------------
//   // 2. گرفتن Thumbnail با پس‌زمینه سفید
//   // --------------------------
//   const stage = stageRef.value;
//   const layer = layerRef.value;

//   const background = new Konva.Rect({
//     x: 0,
//     y: 0,
//     width: stage.width(),
//     height: stage.height(),
//     fill: "white"
//   });

//   layer.add(background);
//   background.moveToBottom();
//   layer.batchDraw();

//   const thumbnailBase64 = stage.toDataURL({
//     pixelRatio: 2
//   });

//   // حذف پس زمینه موقت
//   background.destroy();
//   layer.batchDraw();

//   // --------------------------
//   // 3. آماده سازی Payload
//   // --------------------------
//   const payload = {
//     name: designName.value,
//     data: json,
//     thumbnail_base64: thumbnailBase64,
//     is_template: isTemplate.value   // 🔥 منطق ذخیره Template
//   };

//   try {
//     let res;

//     // --------------------------
//     // UPDATE
//     // --------------------------
//     if (designId.value) {
//       res = await designService.updateDesign(designId.value, payload);
//       alert("طرح بروزرسانی شد ✔");
//     }

//     // --------------------------
//     // CREATE
//     // --------------------------
//     else {
//       res = await designService.createDesign(payload);
//       designId.value = res.data.id;

//       alert("طرح جدید ذخیره شد ✔");
//     }

//   } catch (err) {
//     console.error("Error saving:", err.response?.data || err);
//     alert("خطا در ذخیره طرح");
//   }
// }

async function saveDesign() {
  if (!stageRef.value) {
    alert("Stage آماده نیست");
    return;
  }

  // ⏩ 1) گرفتن snapshot از بوم با پس‌زمینه سفید
  const stage = stageRef.value;
  const layer = layerRef.value;

  // ساخت پس‌زمینه سفید موقت
  const bg = new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: "white"
  });

  // اضافه به پایین‌ترین قسمت بوم
  layer.add(bg);
  bg.moveToBottom();

  // رندر کامل قبل از گرفتن اسکرین‌شات
  layer.batchDraw();

  // گرفتن تصویر با رزولوشن بالا
  const thumbnailBase64 = stage.toDataURL({ pixelRatio: 2 });

  // حذف پس‌زمینه سفید موقت
  bg.destroy();
  layer.batchDraw();

  // 🔹 2) گرفتن داده JSONِ طراحی
  const jsonData = JSON.parse(stage.toJSON());

  // 🔹 3) آماده‌سازی payload
  const payload = {
    name: designName.value,
    data: jsonData,
    thumbnail_base64: thumbnailBase64,
    is_template: isTemplate.value
  };

  try {
    let res;

    // 🔄 اگر طرح از قبل وجود دارد → update
    if (designId.value) {
      res = await designService.updateDesign(designId.value, payload);
      alert("طرح بروزرسانی شد ✔");
      return;
    }

    // 🆕 در غیر این صورت → create جدید
    res = await designService.createDesign(payload);

    if (!res.id) {
      console.error("❌ پاسخ API فاقد id است:", res);
      alert("خطا در دریافت ID طرح");
      return;
    }

    designId.value = res.id;

    // انجام عمل شارژ (کسر اعتبار)
    await designService.chargeSave(res.id);

    alert("طرح جدید ذخیره شد ✔ (11500 تومان کسر شد)");

  } catch (err) {
    console.error("Error saving:", err.response?.data || err);
    alert(err.response?.data?.detail || "خطا در ذخیره طرح");
  }
}






/* ---------------------- Load (axios service) ---------------------- */


// async function loadDesign(id) {
//   try {

//     const res = await designService.getDesign(id);

//     designId.value = res.data.id;
//     designName.value = res.data.name;
//     // مقدار template اینجا باید خوانده شود
//     isTemplate.value = Boolean(res.data.is_template);
//     const dataJson = typeof res.data.data === "string"
//       ? JSON.parse(res.data.data)
//       : res.data.data;

//     createStageFromJSON(dataJson);

//   } catch (err) {
//     console.error(err);
//     return null;
//   }
// }


async function loadDesign(id, isTemplateMode = false) {
  try {
    const res = await designService.getDesign(id);

    const isEditMode = !isTemplateMode;

    // -------------------------------
    // حالت EDIT → نام از دیتابیس
    // -------------------------------
    if (isEditMode) {
      designId.value = res.data.id;
      designName.value = res.data.name;     // ← OK فقط در EDIT
      isTemplate.value = Boolean(res.data.is_template);
    }

    // -------------------------------
    // حالت TEMPLATE → نام از route باید حفظ شود
    // -------------------------------
    else {
      designId.value = null;
      // ❌ اشتباه: designName.value = res.data.name;
      // ❌ باعث می‌شود نام کاربر ناپدید شود
      // ✔ کاری نکن، چون designName قبلاً در onMounted از route ست شده
      isTemplate.value = false;
    }

    // -------------------------------
    // Parse JSON safely
    // -------------------------------
    const dataJson =
      typeof res.data.data === "string"
        ? JSON.parse(res.data.data)
        : res.data.data;

    createStageFromJSON(dataJson);

    return res.data;

  } catch (err) {
    console.error(err);
    return null;
  }
}



/* ---------------------- Load JSON FIX ---------------------- */

function createStageFromJSON(json) {

  if (stageRef.value) {
    stageRef.value.destroy();
  }

  // گرفتن سایز ذخیره شده
  width.value = json.attrs.width
  height.value = json.attrs.height

  const container = document.getElementById("canvas")

  container.style.width = width.value + "px"
  container.style.height = height.value + "px"

  const stage = Konva.Node.create(json, "canvas")

  stageRef.value = stage




  for (const key in canvasSizes) {
    const size = canvasSizes[key]

    if (size.width === width.value && size.height === height.value) {
      selectedSize.value = key
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
      node._id =
        new Date().getTime().toString() +
        Math.random().toString(36).substring(2, 5);
    }

    layersList.value.unshift({
      id: node._id,
      type: node.className,
      displayName: getNodeDisplayName(node)
    });

    if (node.className === "Text") {
  enableTextEdit(node);
  enableTextResize(node);

  // 👇 این را اضافه کن
  // if (node.attrs.placeholder) {
  //   node.attrs.placeholder = node.attrs.placeholder
  // }
}


  });

  stage.on("click", (e) => {

    if (e.target === stage || e.target.getParent()?.className === "Transformer") {
      transformerRef.value.nodes([]);
      selectedNode.value = null;
      activeLayer.value = null;
      return;
    }

    const node = e.target;

    selectNode(node);
    activeLayer.value = node._id;

  });

  layer.batchDraw();
}




// // *** تابع اصلی انتخاب گره (بدون تغییر در نام اصلی) ***
// function selectNode(node) {
//   selectedNode.value = node;
//   transformerRef.value.nodes([node]);
//   activeLayer.value = node._id;
  
// }

function selectNode(node) {
  selectedNode.value = node;
  transformerRef.value.nodes([node]);
  activeLayer.value = node._id;

  // بروزرسانی رنگ
  if (typeof node.fill === "function") {
    fillColor.value = node.fill() || "#000000";
  }
  // ✅ ست کردن placeholder در select
  if (node.className === "Text") {
    selectedPlaceholder.value = node.attrs.placeholder || ""
  } else {
    selectedPlaceholder.value = ""
  }

}


const router = useRouter();

function goToFinalize() {

  if (!stageRef.value) {
    alert("canvas آماده نیست");
    return;
  }

  // گرفتن ساختار JSON
  const jsonData = JSON.parse(stageRef.value.toJSON());

  // گرفتن پیش‌نمایش با پس‌زمینه سفید
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

  // ذخیره در sessionStorage
  sessionStorage.setItem(
    "pendingDesign",
    JSON.stringify({
      name: designName.value,
      json: jsonData,
      preview: previewImage,
      is_template: isTemplate.value,
    })
  );

  // هدایت به صفحه بعد
  router.push("/editor/finalize");
}

return {

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
  removeLayer,
  onLayerDragEnd,

  applyPlaceholder,
  openColorPicker,
  colorInput,
  userFields,
  goToFinalize

}




}
}

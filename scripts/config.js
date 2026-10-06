/* Заполняйте только подтверждённые владельцем данные. Пустые контакты не становятся ссылками. */
const BUSINESS_ADDRESS = "";
window.YMV_CONFIG = {
  name: "YMV Painting Lab",
  city: "Калининград",
  district: "Центральный район",
  address: BUSINESS_ADDRESS,
  phone: "",
  telegram: "",
  whatsapp: "",
  instagram: "",
  // [широта, долгота] — точные координаты студии после подтверждения адреса.
  coordinates: null,
  cityCoordinates: [54.7104, 20.4522],
  demo: true,
  comparison: {
    before: "assets/polish.webp",
    after: "assets/polish.webp",
    demo: true,
    caption: "Демонстрация ползунка: один кадр с разной обработкой. Реальные фотографии до и после будут добавлены отдельно."
  }
};

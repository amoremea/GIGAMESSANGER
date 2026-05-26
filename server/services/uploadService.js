const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Настройка конфига (Ключи должны быть в .env на Render)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'GigaCHAT_Uploads', // Папка в облаке
    resource_type: 'auto',      // Автоматически определяет (картинка, pdf, docx)
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'pdf', 'docx', 'doc'],
  },
});

// Фильтр для проверки типов файлов и размера
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 Мегабайта
  },
  fileFilter: (req, file, cb) => {
    // Список разрешенных MIME-типов
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый формат! Только картинки, PDF и DOCX.'), false);
    }
  }
});

module.exports = upload;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const {
  getAllProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  uploadMainImage,
  uploadProductImages
} = require('../controllers/productsController');

// === Multer config ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ====== PUBLIC ======
router.get('/categories/all', getCategories);
router.get('/', getAllProducts);

// === IMAGE UPLOADS (должны быть ДО /:id) ===
router.post('/:id/main-image', authMiddleware, adminMiddleware, upload.single('image'), uploadMainImage);
router.post('/:id/images', authMiddleware, adminMiddleware, upload.array('images', 3), uploadProductImages);

// ====== ADMIN ONLY ======
router.post('/', authMiddleware, adminMiddleware, addProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

// === CATEGORY ROUTES (ADMIN) ===
router.post('/categories', authMiddleware, adminMiddleware, addCategory);
router.put('/categories/:id', authMiddleware, adminMiddleware, updateCategory);
router.delete('/categories/:id', authMiddleware, adminMiddleware, deleteCategory);

// === В САМОМ КОНЦЕ ===
router.get('/:id', getProductById);

module.exports = router;

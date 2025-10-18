const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const subjectsController = require('../controllers/subject.controller');
const { authJwt } = require("../middlewares");

module.exports = function (app) {
    const subjectRouter = express.Router();

    subjectRouter.get("/", subjectsController.findAllLevels);
    subjectRouter.get("/:level", subjectsController.findLevel);
    subjectRouter.get("/:level/:category", subjectsController.findSubcategoriesByCategory);
    subjectRouter.get("/:level/:category/:subcategory", subjectsController.findCodesByCategory);

    app.use('/api/subject', subjectRouter);

    const uploadDir = path.join(__dirname, '../../public/course-images');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            const ext = path.extname(file.originalname || '');
            cb(null, `${uniqueSuffix}${ext}`);
        },
    });

    const upload = multer({ storage });

    app.get(
        "/api/admin/subjects/:id",
        [authJwt.verifyToken, authJwt.isAdmin],
        subjectsController.getSubjectById
    );

    app.post(
        "/api/admin/subjects",
        [authJwt.verifyToken, authJwt.isAdmin, upload.single('imageFile')],
        subjectsController.createSubject
    );

    app.put(
        "/api/admin/subjects/:id",
        [authJwt.verifyToken, authJwt.isAdmin, upload.single('imageFile')],
        subjectsController.updateSubject
    );

    app.patch(
        "/api/admin/subjects/:id/status",
        [authJwt.verifyToken, authJwt.isAdmin],
        subjectsController.updateSubjectStatus
    );

    app.delete(
        "/api/admin/subjects/:id",
        [authJwt.verifyToken, authJwt.isAdmin],
        subjectsController.deleteSubject
    );

    app.patch(
        "/api/admin/categories/status",
        [authJwt.verifyToken, authJwt.isAdmin],
        subjectsController.updateCategoryStatus
    );

    app.patch(
        "/api/admin/subcategories/status",
        [authJwt.verifyToken, authJwt.isAdmin],
        subjectsController.updateSubcategoryStatus
    );
};

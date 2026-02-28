import express from "express";
import { addSubject } from "../controllers/subjectController.js";
import { getSubjects } from "../controllers/subjectController.js";

const router = express.Router();

router.post("/add-subject", addSubject);
router.get("/get-subjects", getSubjects);

export default router;
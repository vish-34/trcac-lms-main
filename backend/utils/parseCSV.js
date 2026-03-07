import csv from "csv-parser";
import fs from "fs";

export const parseCSV = (filePath) => {
  return new Promise((resolve) => {
    const questions = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        questions.push({
          question: row.question,
          options: [row.optionA, row.optionB, row.optionC, row.optionD],
          correctAnswer: row.correctAnswer
        });
      })
      .on("end", () => resolve(questions));
  });
};
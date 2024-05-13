const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');

const filePath = 'Zendesk FAQs November 2023 - CWMA v.2.xlsx';
const translationsSheetName = 'Spanish';
const locale = 'es';

// const zendeskDomain = process.env['zendeskDomain'];
// const email = process.env['zendeskEmail'];
// const apiToken = process.env['zendeskAPI'];

const auth = Buffer.from(`${email}/token:${apiToken}`).toString('base64');

// Function to read articles list from JSON file
const readArticlesList = () => {
  const jsonData = fs.readFileSync('articlesList.json', 'utf-8');
  return JSON.parse(jsonData);
};

// Function to create a translation for an article in Zendesk
const createTranslation = async (articleId, title, body, locale) => {
  const url = `https://${zendeskDomain}/api/v2/help_center/articles/${articleId}/translations.json`;

  try {
    const response = await axios.post(url, {
      translation: {
        locale,
        title,
        body
      }
    }, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Translation created for article ID ${articleId}: ${response.data.translation.url}`);
  } catch (error) {
    console.error(`Error creating translation for article ID ${articleId}: ${error.message}`);
  }
};

// Function to parse Excel, lookup article IDs, and upload translations
const uploadTranslations = async () => {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[translationsSheetName];

  if (!sheet) {
    console.error(`Sheet ${translationsSheetName} not found.`);
    return;
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // Skip header
  const articlesList = readArticlesList();

  for (let i = 1; i < rows.length; i++) {
    const [excelID, title, body] = rows[i];

    // Find the article ID using the excelID
    const article = articlesList.find(article => article.excelID === excelID);
    if (!article) {
      console.error(`Article with Excel ID ${excelID} not found.`);
      continue;
    }

    console.log(article.id, title, body, locale);

    await createTranslation(article.id, title, body, locale);
  }
};

uploadTranslations();

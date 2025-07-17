require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Contact = require('../models/Contact');
const Tag = require('../models/Tag');
const ActivityLog = require('../models/ActivityLog');
const ChatMessage = require('../models/ChatMessage');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function fetchCRMData(userId) {
  const [contacts, tags, activities,Messages] = await Promise.all([
    Contact.find({ userId }).lean(),
    Tag.find({ userId }).lean(),
    ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(10).lean(),
    ChatMessage.find({ userId }).sort({ timestamp: -1 }).limit(10).lean()

  ]);

  return {
    contactsSummary: `Total: ${contacts.length}, First contact: ${contacts[0]?.name || 'N/A'}`,
    tagsSummary: tags.map(tag => `${tag.name} (${tag.color})`).join(', ') || 'No tags',
    recentActivities: activities.map(act => `- ${act.action} ${act.entityType} at ${new Date(act.timestamp).toLocaleString()}`).join('\n') || 'No recent activities',
    previousMessages: Messages.map(msg => `${msg.sender}: ${msg.message}`).join('\n') || 'No previous messages',
  };
}

async function processWithAI(message, userId) {
  const crmData = await fetchCRMData(userId);

  const prompt = `
You are an intelligent AI assistant integrated into a custom-built CRM. The CRM includes:
- Contacts (with fields like name, company, tags)
- Tags (colored labels assigned to contacts)
- Activity logs (recording user actions like adding/deleting contacts or tags)
- Dashboard summaries (showing stats like total contacts, recent activity, tag usage)

Here is the current user data:
- Contacts Summary: ${crmData.contactsSummary}
- Tags Summary: ${crmData.tagsSummary}
- Recent Activities:\n${crmData.recentActivities}
- Previous Messages: ${crmData.previousMessages}

Answer the user's questions about their CRM, project logic, features, and current data if asked or else chat like an normal chat bot.
User question: ${message}
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(prompt);

  const response = await result.response;

  return response.text().trim();
}


module.exports = { processWithAI };

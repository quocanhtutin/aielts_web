import { testCollectionModel, testSkillModel } from "../models/testModel.js";

export const getCollections = async (req, res) => {
  try {
    const collections = await testCollectionModel.find({isActive: true});
    const collection = collections.map(c => ({_id:c._id, name: c.title}));
    res.json({ success: true, data:[{category: "Cambridge", collection: collection}] });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await testCollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({ success: false, message: "Collection not found" });
    }

    const skills = await testSkillModel.find({ testCollectionId: id });

    const skillData = skills.map(skill => ({_id: skill._id, title: skill.title, type : skill.type}));

    res.json({ success: true, data: { ...collection, skills: skillData } });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getTestSkillDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await testSkillModel.findById(id).lean();

    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    res.json({ success: true, data: test });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCollection = async (req, res) => {
  try {
    const { title, description="" } = req.body;

    const newCollection = await testCollectionModel.create({
      title,
      description
    });

    res.json({ success: true, data: newCollection });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createTestSkill = async (req, res) => {
  try {
    const data = req.body;

    const newSkill = await testSkillModel.create(data);

    res.json({ success: true, data: newSkill });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await testCollectionModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateTestSkill = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await testSkillModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTestSkill = async (req, res) => {
  try {
    const { id } = req.params;

    await testSkillModel.findByIdAndDelete(id);

    res.json({ success: true, message: "Deleted skill" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    await testCollectionModel.findByIdAndDelete(id);

    // xóa luôn skill liên quan
    await testSkillModel.deleteMany({
      testCollectionId: id
    });

    res.json({ success: true, message: "Deleted collection + skills" });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addPart = async (req, res) => {
  try {
    const { testSkillId } = req.params;
    const part = req.body;

    const test = await testSkillModel.findById(testSkillId);
    if (!test) return res.status(404).json({ success: false });

    test.parts.push(part);
    await test.save();

    res.json({ success: true, data: test });
  } catch (e) {
    res.status(500).json({ success: false });
  }
};

export const updatePart = async (req, res) => {
  try {
    const { testSkillId, partIndex } = req.params;
    const partData = req.body;

    const test = await testSkillModel.findById(testSkillId);
    if (!test) return res.status(404).json({ success: false });

    test.parts[partIndex] = partData;

    await test.save();

    res.json({ success: true, data: test.parts[partIndex] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
};
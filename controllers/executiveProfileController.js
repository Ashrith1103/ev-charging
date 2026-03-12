const ExecutiveProfile = require('../models/ExecutiveProfile');
const User = require('../models/User');

// GET /api/executive/profile
const getMyExecutiveProfile = async (req, res) => {
  try {
    const profile = await ExecutiveProfile.findOne({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'role'] }],
    });

    if (!profile) {
      return res.status(404).json({ message: 'Executive profile not found' });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/executive/profile
const createExecutiveProfile = async (req, res) => {
  try {
    const { employeeCode, department, officeLocation, phone, yearsExperience } = req.body;

    if (!employeeCode) {
      return res.status(400).json({ message: 'Employee code is required' });
    }

    const existing = await ExecutiveProfile.findOne({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(400).json({ message: 'Executive profile already exists' });
    }

    const profile = await ExecutiveProfile.create({
      userId: req.user.id,
      employeeCode,
      department,
      officeLocation,
      phone,
      yearsExperience,
    });

    res.status(201).json(profile);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/executive/profile
const updateExecutiveProfile = async (req, res) => {
  try {
    const profile = await ExecutiveProfile.findOne({ where: { userId: req.user.id } });

    if (!profile) {
      return res.status(404).json({ message: 'Executive profile not found' });
    }

    const allowedFields = ['employeeCode', 'department', 'officeLocation', 'phone', 'yearsExperience'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();
    res.json(profile);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/executive/profile
const deleteExecutiveProfile = async (req, res) => {
  try {
    const profile = await ExecutiveProfile.findOne({ where: { userId: req.user.id } });

    if (!profile) {
      return res.status(404).json({ message: 'Executive profile not found' });
    }

    await profile.destroy();
    res.json({ message: 'Executive profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyExecutiveProfile,
  createExecutiveProfile,
  updateExecutiveProfile,
  deleteExecutiveProfile,
};

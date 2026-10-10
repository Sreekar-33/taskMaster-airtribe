const Team = require('../models/Team');

const getId = (field) => {
    if (!field) return null;
    if (field._id) return field._id.toString();
    return field.toString();
};

const canAccessTask = async (task, userId) => {
    const uid = userId.toString();
    if (getId(task.creator) === uid) return true;
    if (getId(task.assignee) === uid) return true;
    if (task.team) {
        const teamId = getId(task.team);
        const isMember = await Team.exists({ _id: teamId, 'members.user': userId });
        return !!isMember;
    }
    return false;
};

module.exports = canAccessTask;

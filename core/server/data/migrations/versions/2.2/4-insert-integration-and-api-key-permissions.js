const _ = require('lodash');
const utils = require('../../../schema/fixtures/utils');
const permissions = require('../../../../services/permissions');
const logging = require('../../../../../shared/logging');

const resources = ['integration', 'api_key'];
const _private = {};

_private.getPermissions = function getPermissions(resource) {
    return utils.findModelFixtures('Permission', {object_type: resource});
};

_private.getRelations = function getRelations(resource) {
    return utils.findPermissionRelationsForObject(resource);
};

_private.printResult = function printResult(result, message) {
    if (result.done === result.expected) {
        logging.info(message);
    } else {
        logging.warn(`(${result.done}/${result.expected}) ${message}`);
    }
};

module.exports.config = {
    transaction: true
};

module.exports.up = (options) => {
    const localOptions = _.merge({
        context: {internal: true}
    }, options);

    return Promise.map(resources, (resource) => {
        const modelToAdd = _private.getPermissions(resource);
        const relationToAdd = _private.getRelations(resource);

        return utils.addFixturesForModel(modelToAdd, localOptions)
            .then(result => _private.printResult(result, `Adding permissions fixtures for ${resource}s`))
            .then(() => utils.addFixturesForRelation(relationToAdd, localOptions))
            .then(result => _private.printResult(result, `Adding permissions_roles fixtures for ${resource}s`))
            .then(() => permissions.init(localOptions));
    });
};

module.exports.down = (options) => {
    const localOptions = _.merge({
        context: {internal: true}
    }, options);

    return Promise.map(resources, (resource) => {
        const modelToRemove = _private.getPermissions(resource);

        // permission model automatically cleans up permissions_roles on .destroy()
        return utils.removeFixturesForModel(modelToRemove, localOptions)
            .then(result => _private.printResult(result, `Removing permissions fixtures for ${resource}s`));
    });
};

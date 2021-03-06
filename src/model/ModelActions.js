import _ from 'lodash'
import { schema, normalize } from 'normalizr';
import { REQUEST, RESPONSE, ACTION, ERROR, SELECTED, RECEIVED, CLEAR } from '../constants'

//TODO: Move URL related logic to APIAdapter
export default class ModelActions {
  constructor(model, config, api) {
    this.modelName = model.modelName
    this.apiPath = config.basePath + '/' + model.modelName
    this.entitySchema = new schema.Entity(model.modelName)
    this.globalOptions = config.globalOptions
    this.api = api
  }

  _successHandler(dispatch, creator) {
    return (response) => {
      console.log('request succeeded with JSON response', response)
      const actionResult = creator(response)
      const actions = _.isArray(actionResult) ? actionResult : [actionResult]
      console.log('firing actions:', actions)
      actions.forEach(action => dispatch(action))
      return response
    }
  }

  _errorHandler(dispatch) {
    return (error) => {
      console.log('request failed', error)
      const dispatchError = (error, message) => dispatch({ type: ERROR, payload: { modelName: this.modelName, error, message } })
      if (error.response) {
        error.response.json().then((response) => {
          dispatchError(response.error, error.message)
        })
      } else {
        dispatchError(error, error.message)
      }
      throw error
      //return error
    }
  }

  _call(path, method, fetchOptions, requestCreator, successCreator) {
    return dispatch => {
      dispatch(requestCreator())
      return this.api.fetch(path, method, fetchOptions, this._successHandler(dispatch, successCreator), this._errorHandler(dispatch))
    }
  }

  _createAction(type, others) {
    return { type, payload: { ...others, modelName: this.modelName } }
  }

  _createNormalized(type, singleInstance = false, listName = undefined) {
    return (response) => {
      let normalized
      if (_.isArray(response)) {
        normalized = normalize(response, [this.entitySchema])
      } else {
        normalized = normalize(response, this.entitySchema)
      }
      console.log('normalized: ', normalized)

      const actions = _.map(normalized.entities, (entities, modelName) => {
        return { type: RECEIVED, payload: { modelName, instances: entities } }
      })
      actions.push(this._createAction(type, { [singleInstance ? 'id' : 'ids']: normalized.result, listName }))
      return actions;
    }
  }

  create(data) {
    return this._call(this.apiPath, 'POST', { body: JSON.stringify(data) },
      () => this._createAction(REQUEST.CREATE, { data }),
      this._createNormalized(RESPONSE.CREATE, true))
  }

  update(id, data) {
    return this._call(`${this.apiPath}/${id}`, 'PATCH', { body: JSON.stringify(data) },
      () => this._createAction(REQUEST.UPDATE, { id, data }),
      this._createNormalized(RESPONSE.UPDATE, true))
  }

  updateAll(where, data) {
    const params = { where: JSON.stringify(where) }
    const body = JSON.stringify(data)
    return this._call(`${this.apiPath}/update`, 'POST', { params, body },
      () => this._createAction(REQUEST.UPDATE_ALL, { where, data }),
      (response) => this._createAction(RESPONSE.UPDATE_ALL, { count: response.count }))
  }

  find(filter, listName = undefined) {
    const params = { filter: JSON.stringify(filter) }
    return this._call(this.apiPath, 'GET', { params },
      () => this._createAction(REQUEST.FIND, { params, listName }),
      this._createNormalized(RESPONSE.FIND, false, listName))
  }

  findById(id, filter) {
    const params = filter ? { filter: JSON.stringify(filter) } : null
    return this._call(`${this.apiPath}/${id}`, 'GET', { params },
      () => this._createAction(REQUEST.FIND_BY_ID, { id, filter }),
      this._createNormalized(RESPONSE.FIND_BY_ID, true))
  }

  deleteById(id) {
    return this._call(`${this.apiPath}/${id}`, 'DELETE', {},
      () => this._createAction(REQUEST.DELETE_BY_ID, { id }),
      (response) => this._createAction(RESPONSE.DELETE_BY_ID, { id: id })
    )
  }

  count(where, listName=null) {
    const params = { where: JSON.stringify(where) }
    return this._call(`${this.apiPath}/count`, 'GET', { params },
      () => this._createAction(REQUEST.COUNT, { where, listName }),
      (response) => this._createAction(RESPONSE.COUNT, { count: response.count, listName })
    )
  }

  custom(name, path, method, options = {}) {
    const _options = { headers: options.headers }
    if (options.params) _options.params = JSON.stringify(options.params)
    if (options.body) _options.body = JSON.stringify(options.body)

    return this._call(`${this.apiPath}/${path}`, method, _options,
      () => this._createAction(REQUEST.CUSTOM, { name, path, method, options }),
      (response) => this._createAction(RESPONSE.CUSTOM, { response: response, name })
    )
  }

  clear() {
    return this._createAction(CLEAR, { })
  }

  delete(filter) {
    throw new Error('not implemented yet')
    // return this._delete(`${this.apiPath}`, {filter: JSON.stringify(filter)},
    //   () => this._createAction(REQUEST.DELETE, { filter }),
    //   (response) => _createPayload(RESPONSE.DELETE, { ids: response.ids })
    // )
  }

}

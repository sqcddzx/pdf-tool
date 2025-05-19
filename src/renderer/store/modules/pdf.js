import Vue from "vue"

const state = {
  pannel: 'home',
}

const getters = {
  
}

const actions = {
  pdfSetState({ commit }, args) {
    commit('SET_STATE', args)
  }
}

const mutations = {
  ['SET_STATE'](state, args) {
    for (let i in args) state[i] = args[i]
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}

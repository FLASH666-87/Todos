import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts renders properly', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('TODOs')
    expect(wrapper.text()).toContain('New TODO')
    expect(wrapper.text()).toContain('TODO list')
  })
})

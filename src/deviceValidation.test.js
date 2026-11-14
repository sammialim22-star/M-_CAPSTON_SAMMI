import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  deviceModelOptions,
  getDeviceModelError,
} from './deviceValidation.js'

test('rejects unrecognized models, including the supplied weapon examples', () => {
  for (const model of [
    'Koloshikov KR-97',
    'AKM',
    'AK-47',
    'hunting rifle',
    'random gadget',
  ]) {
    assert.notEqual(getDeviceModelError(model), '', `${model} should be rejected`)
  }
})

test('accepts each device family offered in the dropdown', () => {
  for (const { models } of deviceModelOptions) {
    for (const model of models) {
      assert.equal(getDeviceModelError(model), '', `${model} should be accepted`)
    }
  }
})

test('accepts typed model names from listed brands and rejects unlisted names', () => {
  for (const model of [
    'iPhone 17 Pro',
    'Samsung Galaxy S25',
    'Lenovo ThinkPad X1 Carbon',
    'Sony PlayStation 5',
  ]) {
    assert.equal(getDeviceModelError(model), '', `${model} should be accepted`)
  }

  assert.notEqual(getDeviceModelError('Koloshikov KR-97'), '')
  assert.notEqual(getDeviceModelError('UnknownBrand Device'), '')
})

test('requires a device model selection', () => {
  assert.equal(getDeviceModelError(''), 'Device model is required.')
  assert.equal(getDeviceModelError('  '), 'Device model is required.')
})

/**
 * @license
 *
 * Copyright IBM Corp. 2019
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import settings from 'carbon-components/es/globals/js/settings';
import { ifDefined } from 'lit-html/directives/if-defined';
import { html, property, customElement } from 'lit-element';
import BXDropdownItem from '../dropdown/dropdown-item';
import styles from './multi-select.scss';

const { prefix } = settings;

/**
 * Multi select item.
 */
@customElement(`${prefix}-multi-select-item`)
class BXMultiSelectItem extends BXDropdownItem {
  /**
   * Unique ID used for form elements.
   */
  protected _uniqueId = Math.random()
    .toString(36)
    .slice(2);

  /**
   * The `name` attribute for the `<input>` for selection. Corresponds to `selection-name` attribute.
   */
  @property({ attribute: 'selection-name' })
  selectionName = '';

  render() {
    const { id: elementId, disabled, selected, selectionName, value } = this;
    return html`
      <div class="${prefix}--list-box__menu-item__option">
        <div class="${prefix}--form-item ${prefix}--checkbox-wrapper">
          <input
            id="__bx-multi-select-item_checkbox_${elementId || this._uniqueId}"
            type="checkbox"
            class="${prefix}--checkbox"
            tabindex="-1"
            readonly
            ?disabled=${disabled}
            .checked=${selected}
            name="${ifDefined(selectionName || undefined)}"
            value="${value}"
          />
          <label for="__bx-multi-select-item_checkbox_${elementId || this._uniqueId}" class="${prefix}--checkbox-label">
            <span class="${prefix}--checkbox-label-text"><slot></slot></span>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * A selector that will return multi select.
   */
  static get selectorList() {
    return `${prefix}-multi-select`;
  }

  static styles = styles;
}

export default BXMultiSelectItem;

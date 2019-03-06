// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  Panel, Widget
} from '@phosphor/widgets';

import {
  IRenderMime
} from '@jupyterlab/rendermime-interfaces';

import {
    WidgetManager
} from './manager';
import { WidgetModel } from '@jupyter-widgets/base';

/**
 * A renderer for widgets.
 */
export
class WidgetRenderer extends Panel implements IRenderMime.IRenderer, IDisposable {
    constructor(options: IRenderMime.IRendererOptions, manager?: WidgetManager) {
        super();
        this.mimeType = options.mimeType;
        if (manager) {
          this.manager = manager;
        }
    }

  /**
   * The widget manager.
   */
  set manager(value: WidgetManager) {
    value.restored.connect(this._rerender, this);
    this._manager.resolve(value);
  }

  async renderModel(model: IRenderMime.IMimeModel) {
    const source: any = model.data[this.mimeType];
    const manager = await this._manager.promise;
    // If there is no model id, the view was removed, so hide the node.
    if (source.model_id === '') {
      this.hide();
      return Promise.resolve();
    }

    let wModel: WidgetModel;
    try {
      wModel = await manager.get_model(source.model_id);
    } catch (err) {
      console.log('Error getting widget state');
      console.log(err);

      // Let's be optimistic, and hope the widget state will come later.
      this.node.textContent = 'Loading widget...';
      this.addClass('jupyter-widgets');

      // If we haven't rerendered in 5 seconds with the right model, display an
      // error message to the user.
      setTimeout(() => {
        if (this._rerenderMimeModel) {
          this.node.textContent = 'Error displaying widget: model not found';
        }
      }, 5000);

      // Store the model for a possible rerender
      this._rerenderMimeModel = model;
      return;
    }

    // Successful getting the model, so we don't need to try to rerender.
    this._rerenderMimeModel = null;

    let widget: Widget;
    try {
      widget = await manager.display_model(undefined, wModel, undefined);
    } catch (err) {
      console.log('Error displaying widget');
      console.log(err);
      this.node.textContent = 'Error displaying widget';
      this.addClass('jupyter-widgets');
    }

    this.addWidget(widget);

    // When the widget is disposed, hide this container and make sure we
    // change the output model to reflect the view was closed.
    widget.disposed.connect(() => {
      this.hide();
      source.model_id = '';
    });

  }

  /**
   * Get whether the manager is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._manager === null;
  }

  /**
   * Dispose the resources held by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    this._manager = null;
  }

  private _rerender() {
    if (this._rerenderMimeModel) {
      // Clear the error message
      this.node.textContent = '';
      this.removeClass('jupyter-widgets');

      // Attempt to rerender.
      this.renderModel(this._rerenderMimeModel);
    }
  }

  /**
   * The mimetype being rendered.
   */
  readonly mimeType: string;
  private _manager = new PromiseDelegate<WidgetManager>();
  private _rerenderMimeModel: IRenderMime.IMimeModel | null = null;
}

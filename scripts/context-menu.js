/*global H5P*/

/**
 * Create context menu
 */
H5P.DragNBarContextMenu = (function ($, EventDispatcher) {

  /**
   * Constructor for context menu
   * @class
   * @param {jQuery} $container Parent container
   * @param {H5P.DragNBarElement} DragNBarElement
   * @param {boolean} [hasCoordinates] Decides if coordinates will be displayed
   * @param {boolean} [disableResize] No input for dimensions
   */
  function ContextMenu($container, DragNBarElement, hasCoordinates, disableResize) {
    EventDispatcher.call(this);

    /**
     * Keeps track of DragNBar object
     *
     * @type {H5P.DragNBar}
     */
    this.dnb = DragNBarElement.dnb;

    /**
     * Keeps track of DnBElement object
     *
     * @type {H5P.DragNBarElement}
     */
    this.dnbElement = DragNBarElement;

    /**
     * Keeps track of context menu container
     *
     * @type {H5P.jQuery}
     */
    this.$contextMenu = $('<div>', {
      'class': 'h5p-dragnbar-context-menu'
    });

    /**
     * Keeps track of buttons container
     *
     * @type {H5P.jQuery}
     */
    this.$buttons = $('<div>', {
      'class': 'h5p-context-menu-buttons'
    });

    /**
     * Keeps track of context menu parent
     *
     * @type {jQuery}
     */
    this.$parent = $container;

    /**
     * Keeps track of whether the context menu should display coordinates
     * @type {Boolean}
     */
    this.hasCoordinates = (hasCoordinates !== undefined ? hasCoordinates : true);

    /**
     * Determines if the dimensions can be changed.
     * @type {boolean}
     */
    this.canResize = !disableResize;

    /**
     * Button containing button name and event name that will be fired.
     * @typedef {Object} ContextMenuButton
     * @property {String} name Machine readable
     * @property {String} label Human readable
     */

    /**
     * Keeps track of button objects
     * @type {ContextMenuButton[]}
     */
    this.buttons = [
      {name: 'Edit', label: H5PEditor.t('H5P.DragNBar', 'editLabel')},
      {name: 'Remove', label: H5PEditor.t('H5P.DragNBar', 'removeLabel')},
      {name: 'BringToFront', label: H5PEditor.t('H5P.DragNBar', 'bringToFrontLabel')}
    ];

    this.updateContextMenu();
  }

  // Inherit event dispatcher
  ContextMenu.prototype = Object.create(EventDispatcher.prototype);
  ContextMenu.prototype.constructor = ContextMenu;

  /**
   * Create coordinates in context menu
   */
  ContextMenu.prototype.addCoordinates = function () {
    // Coordinates disabled or exists
    if (!this.hasCoordinates || this.$coordinates) {
      return;
    }

    var self = this;

    // Add coordinates picker
    this.$coordinates = $(
      '<div class="h5p-dragnbar-coordinates">' +
        '<div class="h5p-dragnbar-x-container" aria-label="X position">' +
          '<input class="h5p-dragnbar-x" type="text" value="0">' +
        '</div>' +
        '<span class="h5p-dragnbar-coordinates-separater">,</span>' +
        '<div class="h5p-dragnbar-y-container" aria-label="Y position">' +
          '<input class="h5p-dragnbar-y" type="text" value="0">' +
        '</div>' +
      '</div>'
    ).mousedown(function () {
      self.dnb.pressed = true;
    }).appendTo(this.$contextMenu);

    this.$x = this.$coordinates.find('.h5p-dragnbar-x');
    this.$y = this.$coordinates.find('.h5p-dragnbar-y');

    this.$x.add(this.$y).on('change keydown', function(event) {
      if (event.type === 'change' || event.which === 13) {

        // Get input
        var x = Number(self.$x.val());
        var y = Number(self.$y.val());

        if (!isNaN(x) && !isNaN(y)) {

          // Do not move outside of container
          var min = {x: 0 , y: 0};
          var max = {
            x: self.dnb.$container.width() - self.dnbElement.getElement().outerWidth(),
            y: self.dnb.$container.height() - self.dnbElement.getElement().outerHeight()
          };

          // Check min values
          if (x < 0) {
            x = min.x;
          }
          if (y < 0) {
            y = min.y;
          }

          // Check max values
          if (x > max.x) {
            x = max.x;
          }
          if (y > max.y) {
            y = max.y;
          }

          // Update and store location
          self.dnb.stopMoving(x, y);

          if (event.which === 13) {
            // Pressed enter, mark number for easy edit
            setTimeout(function () {
              event.target.focus();
              event.target.setSelectionRange(0, event.target.value.length);
            }, 0);
          }

          // Update context menu position
          self.dnb.updateCoordinates();
        }
      }
    }).click(function (event) {
      // Select coordinates numbers for easy edit
      event.target.focus();
      event.target.setSelectionRange(0, event.target.value.length);
    });
  };

  /**
   * Update the coordinates picker.
   *
   * @param {Number} left Left pos of context menu
   * @param {Number} top Top pos of context menu
   * @param {Number} x X value in coordinates
   * @param {Number} y Y value in coordinates
   */
  ContextMenu.prototype.updateCoordinates = function (left, top, x, y) {
    // Move it
    this.$contextMenu.css({
      left: left,
      top: top
    });

    // Set pos
    if (this.hasCoordinates) {
      this.$x.val(Math.round(x));
      this.$y.val(Math.round(y));
    }
  };

  /**
   * Create coordinates in context menu
   */
  ContextMenu.prototype.addDimensions = function () {
    var self = this;

    self.$dimensions = $('<div/>', {
      'class': 'h5p-dragnbar-dimensions',
    });

    var updateDimensions = function (type) {
      var target = parseFloat(this.value);
      if (isNaN(target)) {
        return;
      }

      // Get element
      var $element = self.dnbElement.getElement();

      // Determine min&max values
      var min = 32;
      var containerSize = parseFloat(window.getComputedStyle(self.dnb.$container[0])[type]);
      var max = containerSize - parseFloat(window.getComputedStyle($element[0])[type === 'width' ? 'left' : 'top']);

      if (target < min) {
        target = min;
      }
      if (target > max) {
        target = max;
      }

      $element.css(type, (target / (containerSize / 100)) + '%');
      self['$' + type].val(Math.round(target));

      var eventData = {};
      eventData[type] = target / self.dnb.dnr.containerEm;
      self.dnb.dnr.trigger('stoppedResizing', eventData);
    };

    // Add input for width
    self.$width = self.getNewInput('width', 'Width', self.$dimensions, updateDimensions);

    $('<span/>', {
      'class': 'h5p-dragnbar-dimensions-separator',
      text: '×',
      appendTo: self.$dimensions
    });

    self.$height = self.getNewInput('height', 'Height', self.$dimensions, updateDimensions);

    self.dnb.dnr.on('moveResizing', function () {
      self.updateDimensions();
    });

    self.$dimensions.appendTo(self.$contextMenu);
  };

  /**
   * Updates the values in the input fields for width and height.
   */
  ContextMenu.prototype.updateDimensions = function () {
    var self = this;
    var $element = self.dnbElement.getElement();
    self.$width.val($element.width());
    self.$height.val($element.height());
  };

  /**
   * Creates a new input field for modifying an element property.
   *
   * @param {string} type
   * @param {string} label
   * @param {H5P.jQuery} $container
   * @param {function} handler
   * @returns {H5P.jQuery}
   */
  ContextMenu.prototype.getNewInput = function (type, label, $container, handler) {
    // Wrap input element with label (implicit labeling)
    var $wrapper = $('<div/>', {
      'class': 'h5p-dragnbar-input h5p-dragnbar-' + type,
      'aria-label': label,
      appendTo: $container
    });

    // Create input field
    var $input = $('<input/>', {
      maxLength: 5,
      on: {
        change: function () {
          handler.call(this, type);
        },
        keydown: function (event) {
          if (event.which === 13) { // Enter key
            handler.call(this, type);
            $input.focus().select();
          }
          else if (event.which === 38 || event.which === 40) { // Up key
            // Increase or decrease the number by using the arrows keys
            var currentValue = parseFloat($input.val());
            if (!isNaN(currentValue)) {
              $input.val(currentValue + (event.which === 38 ? 1 : -1));
              handler.call(this, type);
            }
          }
        },
        keyup: function (event) {
          if (event.which === 38 || event.which === 40) { // Up or Down key
            $input.select(); // Select again
          }
        },
        click: function (event) {
          $input.select();
        }
      },
      appendTo: $wrapper
    });
    return $input;
  };

  /**
   * Create button and add it to context menu element
   * @param {object} button
   * @param {string} button.name
   * @param {string} button.label
   */
  ContextMenu.prototype.addToMenu = function (button) {
    var self = this;

    // Create new button
    $('<div>', {
      'class': 'h5p-dragnbar-context-menu-button ' + button.name.toLowerCase(),
      'role': 'button',
      'tabindex': 0,
      'aria-label': button.label
    }).click(function () {
      self.dnb.pressed = true;
      self.trigger('contextMenu' + button.name);
    }).keydown(function (e) {
      var keyPressed = e.which;
      // 32 - space
      if (keyPressed === 32) {
        $(this).click();
      }
    }).appendTo(this.$buttons);
  };

  /**
   * Remove button from context menu
   * @param {String} buttonName
   */
  ContextMenu.prototype.removeFromMenu = function (buttonName) {
    var $removeButton = this.$buttons.children('.h5p-context-menu-button-' + buttonName);
    $removeButton.remove();
  };

  /**
   * Update context menu with current buttons. Useful when having added or removed buttons.
   */
  ContextMenu.prototype.updateContextMenu = function () {
    var self = this;

    // Clear context menu
    this.$buttons.children().remove();

    // Add coordinates
    if (this.hasCoordinates) {
      this.addCoordinates();
    }

    // Add dimensions
    if (this.canResize) {
      this.addDimensions();
    }

    // Add menu elements
    this.buttons.forEach(function (button) {
      self.addToMenu(button);
    });

    this.$buttons.appendTo(this.$contextMenu);
  };

  /**
   * Add button and update context menu.
   * @param {String} name
   * @param {String} label
   */
  ContextMenu.prototype.addButton = function (name, label) {
    this.buttons.push({name:name, label:label});
    this.updateContextMenu();
  };

  /**
   * Remove button from context menu
   * @param {string} name
   */
  ContextMenu.prototype.removeButton = function (name) {
    var self = this;

    // Check if button exists
    self.buttons.forEach(function (button, index) {
      if (button.name === name) {
        self.buttons.splice(index, 1);
        return;
      }
    });

    this.updateContextMenu();
  };

  /**
   * Toggle if coordinates should show
   * @param {Boolean} [enableCoordinates] Enable coordinates
   */
  ContextMenu.prototype.toggleCoordinates = function (enableCoordinates) {
    if (enableCoordinates === undefined) {
      this.hasCoordinates = !this.hasCoordinates;
    }
    else {
      this.hasCoordinates = !!enableCoordinates;
    }

    this.updateContextMenu();
  };

  /**
   * Attach context menu to body.
   */
  ContextMenu.prototype.attach = function () {
    this.$contextMenu.appendTo(this.$parent);
  };

  /**
   * Detach context menu from DOM.
   */
  ContextMenu.prototype.detach = function () {
    this.$contextMenu.detach();
  };

  return ContextMenu;

})(H5P.jQuery, H5P.EventDispatcher);

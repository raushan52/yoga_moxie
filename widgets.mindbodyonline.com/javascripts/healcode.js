if(!window.hcLoadScript) {
  window.hcLoadScript = function(url, callback) {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    if(script.addEventListener) {
      script.addEventListener('load', callback, false);
    }
    else if(script.readyState) {
      script.onreadystatechange = callback;
    }
    head.appendChild(script);
  };
}

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = function (callback, thisArg) {
    thisArg = thisArg || window;
    for (var i = 0; i < this.length; i++) {
      callback.call(thisArg, this[i], i, this);
    }
  };
}

if(!window.HealcodeWidget) {
  window.HealcodeWidget = function(widgetProperties) {
    this.type = widgetProperties.type;
    this.name = widgetProperties.name;
    this.id = widgetProperties.id;
    this.optionsQuery = widgetProperties.options_query;
    this.deployURL = widgetProperties.deploy_url;
    this.containerID = widgetProperties.container_id;
    this.preview = widgetProperties.preview;
  };
}

if(!window.hcWidgetCollection) {
  window.hcWidgetCollection = [];
}

window.hcMobileCheck = function() {
  var windowWidth = (screen.width <= screen.height ? screen.width : screen.height);
  return windowWidth <= 460;
}

if(!window.healcodeInitialize) {
  window.healcodeInitialize = function(widgets) {
    var oldWidgetDeployments = widgets;

    function hcWidgetJsLoad() {

      var mobileFlag = window.hcMobileCheck();
      if(typeof mobileFlag !== 'boolean') mobileFlag = false;

      var customElementWidgets = document.querySelectorAll('healcode-widget');
      var customElementWidgetTypes = [];
      for (var i=0; i<customElementWidgets.length; i++) {
        customElementWidgetTypes.push(customElementWidgets[i].getAttribute('data-type'));
      }
      var totalWidgetCount = oldWidgetDeployments.length + customElementWidgets.length;

      function addCustomElementWidget(widgetElement) {
        customElementWidgets = document.querySelectorAll('healcode-widget');
        customElementWidgetTypes.push(widgetElement.getAttribute('data-type'));
        totalWidgetCount = oldWidgetDeployments.length + customElementWidgets.length;
      }

      function containsWidget(widgetType) {
        var oldDeploymentCheck = !oldWidgetDeployments.every(function(widget, index, array) {
          return(widget.name !== widgetType);
        });
        var customElementCheck = !customElementWidgetTypes.every(function(customElementType, index, array) {
          return(customElementType !== widgetType);
        });
        return (oldDeploymentCheck || customElementCheck);
      }

      function getDeployURL(referenceFrame) {
        if(!/^(.+\.)?healcode\./i.test(referenceFrame.location.host) && /^https?:/i.test(referenceFrame.location.protocol)) {
          return referenceFrame.location.protocol + '//' + referenceFrame.location.host + referenceFrame.location.pathname;
        } else {
          return null;
        }
      }

      function storeDeployURL(widget) {
        var currentDeployURL = widget.deployURL || getDeployURL(window);
        if(!currentDeployURL || !hcjq || widget.preview) return null;
        hcjq.ajax({
          url: 'https://widgets.mindbodyonline.com/widgets/widget/' + widget.id + '/store_deploy_url.json',
          data: { deploy_url: currentDeployURL, widget_type: widget.name },
          dataType: 'jsonp'
        });
      }

      function finishedPostWidgetScripts() {
        if(widgetCheck.healcodeLink()) {
          storeLinkDeployURL();
        }
      }

      function storeLinkDeployURL() {
        var deployURL = getDeployURL(window);
        if(!deployURL || !hcjq) return null;

        var linkTypesBySiteId = {};
        hcjq("healcode-widget[data-type$='-link']").each(function (index, element) {
          var siteId = hcjq(this).attr("data-site-id");
          var linkType = this.linkType();
          if (siteId !== undefined && siteId !== "") {
            if(linkTypesBySiteId[siteId] === undefined) {
              linkTypesBySiteId[siteId] = {'url': deployURL, 'link_types': []};
            }
            if(hcjq.inArray(linkType, linkTypesBySiteId[siteId]['link_types']) === -1) {
              linkTypesBySiteId[siteId]['link_types'].push(linkType);
            }
          }
        });

        hcjq.ajax({
          url: 'https://cart.mindbodyonline.com/link_deploys/store.json',
          data: {"link_deploys": linkTypesBySiteId},
          dataType: "jsonp"
        });
      };


      var widgetCheck = {
        schedule: function() { return containsWidget('schedules'); },
        appointment: function() { return containsWidget('appointments'); },
        enrollment: function() { return containsWidget('enrollments'); },
        registration: function() { return containsWidget('registrations'); },
        prospect:     function() { return containsWidget('prospects'); },
        classList:    function() { return containsWidget('class_lists'); },
        staffList:    function() { return containsWidget('staff_lists'); },
        healcodeLink: function() { return containsWidget('account-link') || containsWidget('cart-link') || containsWidget('pricing-link') || containsWidget("contract-link") || containsWidget("gift-card-link"); }
      };

      var widgetRenderURLs = oldWidgetDeployments.map(function(widget, index, array) {
        var widgetMobileFlag = (widget.optionsQuery ? "&mobile=" + mobileFlag : "?mobile=" + mobileFlag);
        return 'https://widgets.mindbodyonline.com/widgets/' + widget.name + '/' + widget.id + '.js' + widget.optionsQuery + widgetMobileFlag;
      });

      function preWidgetScripts() {
        return [{
          test: window.hcjq && window.hcjq.ui && window.hcjq.rails,
          nope: ['https://assets.healcode.com/assets/jquery-1.8.1-ae87bcf813ab26ac663e4717630b900fa77c9f0228ac581d976c0a3fd42b062d.js', 'https://assets.healcode.com/assets/jquery-ui.widget-e9f89d57c8a6321d04f1ad6e4f82f4db3490be96a5254c8e49921d56505d016b.js', 'https://assets.healcode.com/assets/jquery_ujs-080ddca6c3a803eb4aadb789895c2117eef8025c29a0ef657a736d743cb81027.js', 'https://assets.healcode.com/assets/widgets/jquery-ui/jquery-ui.widget-b1d27911eb082a4ca72976886eb6594337099a1b8d3221ecb1caa32f25d8be76.css', 'https://assets.healcode.com/assets/hcjq-4d05e9bbab0a5ec554c0ba6b12845c65e402700a0fe50dd29b9683d01f096a83.js']
        }, {
          test: !window.hcSessionFilter && (widgetCheck.schedule() || widgetCheck.enrollment()),
          yep: ['https://assets.healcode.com/assets/filter_sessions-22f2fc2f2468babc8854b39178c10848329522d3abc49a19d741e318f99488b6.js','https://assets.healcode.com/assets/jquery-ui-datepicker-localization-073ecb400a31302845b0735e093db65771811ab4ea24bcfcc7842a8f8b812d06.js']
        }, {
          test: !window.hcPignoseCalendar && (widgetCheck.enrollment() || widgetCheck.schedule()),
          yep: ['https://assets.healcode.com/assets/moment.hcjq-513e187e05143dbe64771dd553de166b7ca2f4b1e62363723471e2f0d75a247d.js', 'https://assets.healcode.com/assets/pignose.calendar.hcjq-9a1bdeaec658c103c755ce71a8b3c25f6b2b6425d429371341624d2ae0ef89b6.js', 'https://assets.healcode.com/assets/widgets/pignose.calendar.hcjq-a8a9160b4852572f4f8e5f65a90dd25f2f8d12fa2f4004ef136e032fd501974e.css']
        }, {
          test: !window.bwScheduleVersion1 && widgetCheck.schedule(),
          yep: ['https://assets.healcode.com/assets/widgets/schedule/version_1-cc730dbed7c720018602b6ef15f2f5b23880421aa14f3489559e200f664a5a81.js', 'https://assets.healcode.com/assets/widgets/schedule/load_markup-80e400255b99f836dfa7c8dd92e20431fd673d432ea47485b8442312433e142e.js', 'https://assets.healcode.com/assets/widgets/schedule/version_1-ddcc61c4445d7b6b351831c2e1f4fe6f1fbef2a17ceffb50bdedaf261fa1ada9.css', 'https://assets.healcode.com/assets/widgets/schedule/filter-c24a27e81a6e99f7e57e00a82416171ab4aed54e1424cfaf20c75aca306ea7e0.js']
        }, {
          test: !window.bwFilterSessions && widgetCheck.schedule(),
          yep: 'https://assets.healcode.com/assets/widgets/schedule/filter_sessions_version_1-a9ca3914ff1f30b781f274903894d71459b131c4b5abc80cce21dd3fe13be4bb.js'
        }, {
          test: !window.hcParsley && (widgetCheck.prospect() || widgetCheck.registration() || widgetCheck.appointment()),
          yep: ['https://assets.healcode.com/assets/parsley/i18n.hcjq-d90a9936c9c3c63be7f0cfb0d0f852578063d44f28c2c52c1cc81affb26a58cb.js', 'https://assets.healcode.com/assets/parsley.hcjq-650a5185dba5598080d6885208a10436e59ad56a1db2d34808d04508616b6bf7.js', 'https://assets.healcode.com/assets/parsley-c5cfe6376a3d5405731e96fa6336282e8076efc07991fec1ab60b3036d5aa682.css']
        }, {
          test: !window.hcAmplitude,
          yep: ['https://assets.healcode.com/assets/ampl_init-790b36b1a70c21a9a7e5fbd2f3e72c2abef25874e7f5c5fe63c6f9bf7ba60412.js', 'https://assets.healcode.com/assets/ampl_events-f02a179d23d31bc308ee22c91d70ec4294aacb92822cd1cba5aefaf705bd56d6.js']
        }, {
          test: !window.hcStateSelect && widgetCheck.registration(),
          yep: 'https://assets.healcode.com/assets/state_select-3c0d9b6e8ab403bbf080ea3b72e2cd47c0c69d23fe572002520a486bed286186.js'
        }, {
          test: !window.hcAppointmentFilterSessions && widgetCheck.appointment(),
          yep: 'https://assets.healcode.com/assets/filter_appt_sessions-dec4497f99e097d9ad4176a54ff0103f9080c15a0987c8de659fddd94fc96137.js'
        }, {
          test: !window.hcScheduleWidget && widgetCheck.schedule(),
          yep: 'https://assets.healcode.com/assets/schedule-67fdcdde10909b73dfe4df44490f3f69a561b6ad0a192aebfbdb7019e370dca7.js'
        }, {
          test: !window.hcEnrollmentWidget && widgetCheck.enrollment(),
          yep: 'https://assets.healcode.com/assets/enrollment-53842e65b9af9d12e91b78753de3dadc8361f27f1e49393d7ef19154d47b028f.js'
        }, {
          test: !window.hcClassStaffListWidget && (widgetCheck.staffList() || widgetCheck.classList()),
          yep: 'https://assets.healcode.com/assets/staff_class_lists-63cdda3de8e51f9780eaf62fd162dc6bfe71df530a544b528db54cef2291ce90.js',
        }, {
          test: !window.hcAppointmentWidget && widgetCheck.appointment(),
          yep: ['https://assets.healcode.com/assets/appointment-dca45c6f8d49b653adcc3602b1a18b6271a86ad93f1ce5eb312c7be9832d097a.js', 'https://assets.healcode.com/assets/jquery-ui-datepicker-localization-073ecb400a31302845b0735e093db65771811ab4ea24bcfcc7842a8f8b812d06.js', 'https://assets.healcode.com/assets/jquery.weekpicker-ca787193e63197762268046404095f0e296776f90f33478d1a9d4cc3fcb9f188.js'],
          callback: function(url, result, key) {
            window.hcAppointmentWidget = true;
          }
        }, {
          test: !window.hcRegistrationWidget && widgetCheck.registration(),
          yep: ['https://assets.healcode.com/assets/registration-39d771f5820be78396d5fed954435df6afb201957e6276da814080ef1691c4a5.js'],
          callback: function(url, result, key) {
            window.hcRegistrationWidget = true;
          }
        }, {
          test: !window.hcProspectWidget && widgetCheck.prospect(),
          yep: ['https://assets.healcode.com/assets/prospect-aac322fcd1634becefab3a19a710c001014cd926396c07cedeab09ce72a4050b.js'],
          callback: function(url, result, key) {
            window.hcProspectWidget = true;
          }
        }, {
          test: !window.hcWidgetJs && (widgetCheck.schedule() || widgetCheck.appointment() || widgetCheck.enrollment() || widgetCheck.classList() || widgetCheck.staffList() || widgetCheck.healcodeLink()),
          yep: 'https://assets.healcode.com/assets/widget-6e44174073497d000ab10c3faaeb946b3e69b9ab8762f7469f15a9270b42f9c4.js',
          callback: function(url, result, key) {
            window.hcWidgetJs = true;
          }
        }];
      }

      function postWidgetScripts() {
        return [{
          test: !window.hcCSSModal && (widgetCheck.schedule() || widgetCheck.appointment() || widgetCheck.enrollment() || widgetCheck.classList() || widgetCheck.staffList() || widgetCheck.healcodeLink()),
          yep: ['https://assets.healcode.com/assets/modal-f32fcb5f236841667a995feed2a38c53f34db2c13f27b388e3dc0007f7620254.js', 'https://assets.healcode.com/assets/modal-618c37dbefa7fe1e7f26d5113ac6bc8623b3ea377d272f9440d3af0497793c27.css'],
          callback: function(url, result, key) {
            if(!window.postWidgetScripts) {
              finishedPostWidgetScripts();
              window.postWidgetScripts = true;
            }
          }
        }];
      }

      function registerHealcodeWidgetCustomElement($, loadCounter) {

        var validWidgetTypes = ['schedules', 'enrollments', 'staff_lists', 'class_lists', 'prospects', 'registrations', 'appointments'];


        var $loadingText = $('<div class="hc-ajax-loading-text"><img alt="loading" src="https://assets.healcode.com/assets/icons/ajax-loader-01660019227d7e88b38c8ff7ec68f7d110725dc8ca92db6b2dd2892dfc519d4c.gif" /></div>');
        $loadingText.css({
          fontSize: '3em',
          margin: '10% 0',
          padding: '25px',
          textAlign: 'center',
          borderRadius: '4px'
        });

        function loadingErrorMarkup() {
          var errorMessage = arguments[0] || 'Unable to load.<br>Please try again later.';

          var $errorMarkup = $('<div></div>')
            .addClass('hc-ajax-loading-text')
            .css({
              width: '12em',
              fontSize: '1em',
              margin: '1em 40%',
              padding: '1em',
              textAlign: 'center',
              border: 'solid black 1px'
            });

          var $refreshLink;

          if (!/widget has been deactivated/i.test(errorMessage)) {
            $refreshLink = $('<a href=""></a>')
              .text('Reload')
              .css({
                border: 'solid black 1px',
                fontSize: '0.8em',
                textAlign: 'center',
                verticalAlign: 'middle',
                display: 'inline-block',
                textDecoration: 'none',
                textTransform: 'uppercase',
                margin: '1em 0 0 0',
                padding: '0.2em 0.5em',
                lineHeight: '1.5',
                '-webkit-border-radius': '0.25em',
                '-moz-border-radius': '0.25em',
                '-o-border-radius': '0.25em',
                borderRadius: '0.25em'
              })
              .on({
                click: function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  $(this).closest('healcode-widget')[0].getAndInjectWidgetContent();
                }
              });
          }

          $errorMarkup.append('<div>' + errorMessage + '</div>', $refreshLink);

          return $errorMarkup;
        }

        function createLink(containerElement, linkType, linkLoadCounter) {
          var itemID = containerElement.getAttribute('data-item-id') ||
            containerElement.getAttribute('data-service-id') ||
            containerElement.getAttribute('data-contract-id');

          var link = {
            linkClass: containerElement.getAttribute('data-link-class') || '',
            title: linkType,
            innerHTML: containerElement.getAttribute('data-inner-html').replace(/"/g, "'"),
            siteID: containerElement.getAttribute('data-site-id'),
            siteMBOID: containerElement.getAttribute('data-mb-site-id'),
            typeName: containerElement.getAttribute('data-type'),
            dataURL: '',
            itemID: itemID,
            loadCounter: linkLoadCounter
          };

          link.dataURL  = 'https://cart.mindbodyonline.com/sites/' + link.siteID + '/';
          link.dataURL += (linkType === 'account' ? 'client' : 'cart');

          linkTypeJumpTable = {
            "contract":  createContractLink,
            "gift-card": createGiftCardLink,
            "pricing":   createPricingLink
          };

          function installer(linkHTML) {
            $(containerElement).html(linkHTML).promise().done(function () {
              link.loadCounter.increment();
            });
          }

          var specifier = linkTypeJumpTable[linkType] || createServiceLink;

          specifier(link, installer);
        }

        function apiPredicate(uri, kontinue) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", uri);
          xhr.onload = function() {
            kontinue( JSON.parse(xhr.responseText) );
          }
          xhr.send();
        }

        function createContractLink(link, installer) {
          link.title = link.itemID;
          link.dataURL += '/add_contract?mbo_item_id=' + link.itemID;
          var linkHTML = '<a href="" class="healcode-link ' + link.linkClass + '" data-url="' + link.dataURL + '" data-widget-name="' + link.typeName + '" data-mbo-site-id="' + link.siteMBOID + '" rev="iframe" title="' + link.title + '" data-hc-open-modal="modal-iframe">' + link.innerHTML + '</a>';
          installer(linkHTML);
        }

        function createGiftCardLink(link, installer) {
          apiPredicate('https://cart.mindbodyonline.com/links/sell_giftcard_with_cart/' + link.siteID + '/' + link.itemID, function (data) {
            var linkHTML = '';

            if (data.cart_enabled) {
              link.dataURL += '/gift_cards/add?mbo_id=' + link.itemID;
              linkHTML = '<a href="" class="healcode-link ' + link.linkClass + '" data-url="' + link.dataURL + '" data-widget-name="' + link.typeName + '" data-mbo-site-id="' + link.siteMBOID + '" rev="iframe" title="' + link.title + '" data-hc-open-modal="modal-iframe">' + link.innerHTML + '</a>';
            }
            else {
              link.dataURL = 'https://clients.mindbodyonline.com/classic/ws?studioid=' + link.siteMBOID + '&stype=42&giftcardid=' + link.itemID;
              var linkHTML = '<a href="' + link.dataURL + '" class="' + link.linkClass + '" title="' + link.title + '" target="_blank" rel="noopener noreferrer">' + link.innerHTML + '</a>';
            }

            installer(linkHTML);
          });
        }

        function createPricingLink(link, installer) {
          link.title    = link.itemID;
          link.dataURL += '/add_service?mbo_item_id=' + link.itemID;
          createServiceLink(link, installer);
        }

        function createServiceLink(link, installer) {
          var linkHTML = '<a href="" class="healcode-link ' + link.linkClass + '" data-url="' + link.dataURL + '" data-widget-name="' + link.typeName + '" data-mbo-site-id="' + link.siteMBOID + '" rev="iframe" title="' + link.title + '" data-hc-open-modal="modal-iframe">' + link.innerHTML + '</a>';
          installer(linkHTML);
        }

        function UrlEncodeObject(element, key, list) {
          var list = list || [];

          if (typeof(element) == 'object') {
            for (var item in element) {
              UrlEncodeObject(element[item], key ? key + '[' + item + ']' : item, list);
            }
          }
          else {
            list.push(key + '=' + encodeURIComponent(element));
          }

          return list.join('&');
        }

        function createWidget(widgetElement, widgetLoadCounter) {
          var mobileFlag = window.hcMobileCheck();
          var widgetType = $(widgetElement).data('type');
          var httpMethod = "GET";
          var xhr = new XMLHttpRequest();

          if(typeof mobileFlag !== 'boolean') mobileFlag = false;

          var httpParams = {
            mobile: mobileFlag,
            preview: widgetElement.isPreview(),
            version: widgetElement.version()
          };

          $(widgetElement).html($loadingText);

          xhr.open(httpMethod, widgetElement.requestURL() + '?' + UrlEncodeObject( httpParams ) );

          xhr.onload = function() {
            if (xhr.status === 200) {
              var data = null;

              try { // just in case...
                data = JSON.parse(xhr.responseText);
              }
              catch (e) {
                // data should remain null at this point
                var errMsg = "Error parsing JSON: " + xhr.responseText;
                data = { errors: [ errMsg ] };
              }

              if (data.errors) {
                var errors = data.errors;
                console.log('AJAX request failed - ' + errors.join(', '));
                $(widgetElement).html(loadingErrorMarkup(errors.join('<br>')));
              } else {
                $(widgetElement).html(data.contents).promise().done(function() {
                  widgetLoadCounter.increment();
                  // We need to update the CSRF Token for registrations and prospect forms
                  // Due to the forms being loaded in via Ajax the tokens do not match
                  updateCSRFToken(widgetElement);
                  // TODO: fix this when we fix the masked ID in NSW issue
                  if (widgetElement.querySelectorAll('.bw-widget').length){
                    var maskedID = $(widgetElement).data('widget-id').toString();
                    var widgetID = maskedID.substring(2, maskedID.length - 4);
                  } else {
                    var widgetID = $(widgetElement).data('widget-id');
                  }
                  $.event.trigger('widget:loaded', [widgetID, widgetType]);
                });
              }
            }
            else if (xhr.status !== 200) {
              console.error('AJAX request failed - ' + xhr.status);
              $(widgetElement).html(loadingErrorMarkup());
            }
          };

          xhr.send();
        }

        function updateCSRFToken(widgetElement) {
          // We only want to do this on registrations and prospects
          if ((widgetCheck.registration() || widgetCheck.prospect()) && $('meta[name=csrf-token]').length > 0) {
            const originalCSRFToken = $('meta[name=csrf-token]').attr('content');
            $('input[name=authenticity_token]', widgetElement).val(originalCSRFToken);
          }
        }

        function updateLinkInnerHTML(widgetElement, newText) {
          var formattedText = newText.replace(/"/g, "'");
          $('a', widgetElement).html(formattedText);
        }

        function updateLinkClass(widgetElement, newClass) {
          var formattedClass = newClass.replace(/"/g, "'");
          $('a', widgetElement).attr('class', newClass);
        }

        var healcodeWidget = Object.create(HTMLElement.prototype);

        healcodeWidget.createdCallback = function() {
          if (window.hcPreviewCreatedAlready) {
            // 
            // 
            // 
            // 
            // 
            return null
          } else if (this.isPreview()) {
            window.hcPreviewCreatedAlready = true;
          }

          if(!this.isLink()) {
            if(validWidgetTypes.lastIndexOf(this.type()) === -1) {
              console.log('Invalid widget type - ' + this.type());
              return null
            }
            storeDeployURL(this.convertToHealcodeWidgetObject());
          }
          if(window.hcInitialized) {
            addCustomElementWidget(this);
            window.hcYepnope(preWidgetScripts().concat({
              test: true,
              complete: this.getAndInjectWidgetContent.bind(this)
            }).concat(postWidgetScripts()));
          } else {
            this.getAndInjectWidgetContent();
          }
        };

        healcodeWidget.attachedCallback = function() {
          if(!this.isLink()) window.hcWidgetCollection.push(this.convertToHealcodeWidgetObject());
        };

        healcodeWidget.attributeChangedCallback = function(attrName, oldVal, newVal) {
          if(this.isLink()) {
            if(attrName === 'data-inner-html') {
              updateLinkInnerHTML(this, newVal);
            } else if(attrName === 'data-link-class') {
              updateLinkClass(this, newVal);
            }
          }
        };

        healcodeWidget.getAndInjectWidgetContent = function() {
          if(this.isLink()) {
            createLink(this, this.linkType(), loadCounter);
          } else {
            createWidget(this, loadCounter);
          }
        };

        healcodeWidget.convertToHealcodeWidgetObject = function() {
          return new HealcodeWidget({
            type: this.partner(),
            name: this.type(),
            id: this.widgetId(),
            preview: this.isPreview()
          });
        };

        healcodeWidget.type = function() { return this.getAttribute('data-type'); };
        healcodeWidget.isLink = function() { return this.type().match(/(.*)-link$/i); };
        healcodeWidget.linkType = function() {
          var isLink = this.isLink();
          if(isLink) {
            return isLink[1];
          } else {
            return null;
          }
        };
        healcodeWidget.partner = function() { return this.getAttribute('data-widget-partner'); };
        healcodeWidget.widgetId = function() { return this.getAttribute('data-widget-id'); };
        healcodeWidget.isPreview = function() { return this.getAttribute('data-preview'); };
        healcodeWidget.version = function() { return this.getAttribute('data-widget-version'); };
        healcodeWidget.requestURL = function() {
          return 'https://widgets.mindbodyonline.com/widgets/' + this.type() + '/' + this.widgetId() + '.json';
        };

        document.registerElement('healcode-widget', { prototype: healcodeWidget });
      }

      function documentReadyWidgetLoad() {
        oldWidgetDeployments.forEach(storeDeployURL);

        var widgetLoadCounter = {
          count: 0,
          increment: function() {
            this.count = this.count + 1;
            return this.count;
          },
          decrement: function() {
            this.count = this.count - 1;
            return this.count;
          }
        };

        registerHealcodeWidgetCustomElement(hcjq, widgetLoadCounter);

        widgetRenderURLs.forEach(function(renderURL, index, array) {
          window.hcYepnope.injectJs(renderURL, function() {
            widgetLoadCounter.increment();
          });
        });

        var delayScriptLoading = function(){
          if(widgetLoadCounter.count >= totalWidgetCount) {
            window.hcInitialized = true;
            window.hcYepnope(postWidgetScripts());
            return null;
          } else {
            setTimeout(delayScriptLoading, 100);
          }
        };

        delayScriptLoading();
      }

      window.hcYepnope(preWidgetScripts().concat({
        load: 'https://assets.healcode.com/assets/application-f5eb887b14d68feca1db7a2df3a5ad8f3cfa3c855ae6488506912bd36c9d578f.js',
        complete: documentReadyWidgetLoad
      }));
    }

    window.hcLoadScript('https://assets.healcode.com/assets/x-tag-components-ffa3f37e7cd90471c3d18c4ced28b725242b8d846985072daccdc3112a837e4d.js', function() {});

    if(window.hcYepnope) {
      hcWidgetJsLoad();
    } else {
      window.hcLoadScript('https://assets.healcode.com/assets/healcode.yepnope-529ba1f46fcfad8dc4807adba907d762c2f68469d4856d82113d7fd35b2be939.js', hcWidgetJsLoad);
    }
  };

  var hcOnDocumentReady = function(f){/in/.test(document.readyState)?setTimeout('hcOnDocumentReady('+f+')',9):f()};

  hcOnDocumentReady(function() {
    window.healcodeInitialize(window.hcWidgetCollection); // on DOM ready, fire off initializer
  });
}

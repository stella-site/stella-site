jQuery(document).ready(function($) {
	$(document).on('click', '.popup', function () {
    $.magnificPopup.open({
      items: {
        src: '#block-webform-client-block-8',
        type: 'inline'
      }
    });
    return false;
  });
  
  $('select=[name="submitted[office_id]"]').chosen({disable_search_threshold: 10});

  // ==============================================
  // меню
    function MobMenuAddHideClass()
    {
      if($(document).width()<=767)
      {
        if($('.j-menu-hide').hasClass('menu-hidden')===false && $('.menu-switcher').hasClass('active')===false)
          $(".j-menu-hide").addClass('menu-hidden')
      }
      if($(document).width()>767){
        if($('.j-menu-hide').hasClass('menu-hidden')===true)
          $(".j-menu-hide").removeClass('menu-hidden')         
      }
    }

    $(window).resize(function() {
      MobMenuAddHideClass();
    });

    MobMenuAddHideClass();
    $(document).on('click', '.menu-switcher', function () {
      $(this).toggleClass('active');
      $(".j-menu-hide").toggleClass('active');
      $(".j-content-hide, .j-menu-hide").toggleClass('menu-hidden');
      return false;
    });
  // ==============================================
  // таблица
    $(document).on('click', '.table_mob_switcher', function () {
      $(".table-suggest__sglist").show();
	  $(this).addClass('active')
    });
    $(document).on('click', '.table-suggest__sgitem', function () {
      $(".table-suggest__sglist").hide();
	  $(".table_mob_switcher").removeClass('active');
      var mounthSelect = $(this).attr('data-mounth');
      $(".table_mob_v td").removeClass('active');
      $(".table_mob_v td."+mounthSelect).addClass('active');
      return false;
    });
  // ==============================================

});


(function ($) {

  Drupal.behaviors.webform_change = {
    attach: function (context, settings) {
      $('.webform-client-form', context).each(function () {
        var $form = $(this);

        // chosen ставится на все select, у которых в родителях нет класса page_no_chosen
            if (typeof $().chosen == "function") {
                $('.form-select', context).filter(function(i, el) {
                    return !$(el).closest('.page_no_chosen').length;
                }).chosen({disable_search_threshold: 10, no_results_text: Drupal.t('No results match')});
            }
      });
    }
  };    
  
  var agreeds = {};
  Drupal.behaviors.agreement = {
    attach: function (context) {
      $(context).find('.webform-client-form').each(function () {
        var form = this;
        if ($(form).find('label.agreement').length) {
          if (agreeds[$(form).attr('id')]) {
            $(form).find('label.agreement input').prop('checked', true);
          }
        
          $(form).find('label.agreement input').click(function () {
            setDisabled();    
          });
          setDisabled();
          
          function setDisabled () {
            if ($(form).find('label.agreement input').is(':checked')) {
              $(form).find('.form-submit').attr('disabled', false);
              agreeds[$(form).attr('id')] = 1;
            } else {
              $(form).find('.form-submit').attr('disabled', true);
              agreeds[$(form).attr('id')] = 0;
            }
          }
        }
      });
    }
  };  
})(jQuery);
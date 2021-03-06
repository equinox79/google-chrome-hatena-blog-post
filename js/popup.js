var main,
    setup;

main = function() {
  "use strict";

  var userName    = localStorage.getItem('userName'),
      apiKey      = localStorage.getItem('apiKey'),
      endpointUrl = localStorage.getItem('endpointUrl'),
      title       = localStorage.getItem('title'),
      content     = localStorage.getItem('content'),
      isDraft     = localStorage.getItem('isDraft'),
      wHeader     = wsseHeader(userName, apiKey),
      saveContents,
      constructPostXML,
      serviceDocument,
      blogName,
      sever;

  $.fn.extend({
      insertAtCaret: function(v) {
        var o = this.get(0);
        o.focus();
        var s = o.value;
        var p = o.selectionStart;
        var np = p + v.length;
        o.value = s.substr(0, p) + v + s.substr(p);
        o.setSelectionRange(np, np);
      }
  });

  blogName = localStorage.getItem('blogName');
  if (!blogName) {
    $.ajax({
      url:  endpointUrl,
      type: 'get',
      headers: {
        'X-WSSE': wHeader
      },
      datatype: 'xml',
      success: function (xmlData) {
        serviceDocument = xmlData;
        blogName = $(serviceDocument).find('title')[0].textContent;

        if (blogName.length >= 15) {
          blogName = blogName.slice(0, 15) + '...';
        }

        localStorage.setItem('blogName', blogName);
        $('<h3>').text(blogName).insertAfter('#top');
      },
      error: function () {
      }
    });
  } else {
    $('<h3>').text(blogName).insertAfter('#top');
  }

  $('#title').val(title);
  $('#content').val(content);
  $('#isDraft').val([isDraft]);

  constructPostXML = function(userName, title, body, isDraft) {
    var xml = '<?xml version="1.0" encoding="utf-8"?>' +
              '<entry xmlns="http://www.w3.org/2005/Atom"' +
                     'xmlns:app="http://www.w3.org/2007/app">' +
                '<title>' + title + '</title>' +
                '<author><name>' + userName + '</name></author>' +
                '<content type="text/plain">' + body + '</content>' +
                '<app:control>' +
                  '<app:draft>' + isDraft + '</app:draft>' +
                '</app:control>' +
              '</entry>';
    return xml;
  };

  saveContents = function() {
    var title, content, isDraft;
    title   = $('#title').val();
    content = $('#content').val();
    isDraft = $('#isDraft:checked').val();

    localStorage.setItem('title', title);
    localStorage.setItem('content', content);
    localStorage.setItem('isDraft', isDraft);
  };
  sever = setInterval( function () {saveContents();}, 16);

  $('#submit').click(function () {
    var title, content, isDraft;
    title   = $('#title').val();
    content = $('#content').val();
    isDraft = 'no';

    if ($('#isDraft:checked').val() === 'yes') {
      isDraft = 'yes';
    }

    var xml = constructPostXML(userName, title, content, isDraft);
    $.ajax({
      url:  endpointUrl + '/entry',
      type: 'post',
      headers: {
        'X-WSSE': wHeader
      },
      contentType: 'text/xml;charset=UTF-8',
      datatype: 'xml',
      data: xml,
      success: function () {
        clearInterval(sever);
        localStorage.setItem('title', '');
        localStorage.setItem('content', '');
        localStorage.setItem('isDraft', '');
        window.close();
      },
      error: function () {
        $('body').append('<br><font color="red">Post failed...</font>');
      }
    });
  });

  $('#pageInfo').click(function () {
    chrome.tabs.getSelected(window.id, function (tab) {
      $('#content').insertAtCaret(tab.title + ' - ' + tab.url);
    });
  });
};

setup = function() {
  return chrome.tabs.create({
    url: chrome.extension.getURL('options.html')
  });
};

if ((localStorage.getItem('userName') && localStorage.getItem('apiKey') && localStorage.getItem('endpointUrl'))) {
  main();
} else {
  setup();
}

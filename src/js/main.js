/* global Promise, moment, bootbox */

(() => {
  'use strict';
  
  const pendingSignatures = [];
  
  const decryptionCache = {};
  
  const getEncryptedOrDecryptedText = (text, encrypt) => {
    return new Promise((resolve, reject) => {
      const payload = {data: {}};
      if (encrypt) {
        payload.data.text = text;
      } else {
        if (typeof decryptionCache[text] !== 'undefined') {
          resolve(decryptionCache[text]);
          return;
        }
        payload.data.encrypted = text;
      }
      
      $.ajax({
        type: 'POST',
        url: encrypt ? '/rsa/encrypt' : '/rsa/decrypt',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(payload),
        dataType: 'json',
        success: (data) => {
          if (!encrypt) {
            decryptionCache[text] = data.text;
          }
          resolve(encrypt ? `<object type="redacted-text">${data.encrypted}</object>` : data.text);
        },
        error: () => {
          reject();
        }
      });
    });
  };
  
  const getGhIssues = () => {
    return new Promise((resolve, reject) => {
      $.ajax({
        type: 'GET',
        url: '/gh/issues',
        dataType: 'json',
        success: (data) => {
          resolve(data);
        },
        error: () => {
          reject();
        }
      });
    });
  };
  
  const renderPageTemplate = (issues) => {
    return new Promise((resolve, reject) => {
      const payload = {
        issues: issues
      };

      $.ajax({
        type: 'POST',
        url: '/gen/page',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(payload),
        dataType: 'text',
        success: (text) => {
          resolve(text);
        },
        error: () => {
          reject();
        }
      });
    });
  };
  
  const updateDocument = () => {
    const issues = [];
    $('.issue-container')
      .find('.selected')
      .each((index, element) => {
        issues.push({
          title: $(element).attr('data-title'),
          text: $(element).attr('data-text')
        });
      });
    
    renderPageTemplate(issues).then((text) => {
      smde.value(text);
    });
    
    updateCommitMessage();
  };
  
  const updateCommitMessage = () => {
    const issueNumbers = [];
    $('.issue-container')
      .find('.selected')
      .each((index, element) => {
        let number = $(element).attr('data-number');
        issueNumbers.push(`resolves #${number}`);
      });
      
      $('#commitMessageInput').val(issueNumbers.join(' '));
  };
  
  const updateIssues = () => {
    $('.issue-container').empty();
    getGhIssues().then((issues) => {
      issues.forEach((issue) => {
        $('.issue-container').append(pugIssue(issue));
      });
      updateDocument();
    });
  };
  
  const checkSignature = (token) => {
    $.ajax({
      type: 'GET',
      url: `/signature/status/${token}`,
      dataType: 'json',
      success: (data) => {
        if (!data.signed) {
          pendingSignatures.push(token);
          return;
        }
        
        const currentValue = smde.value();
        smde.value(currentValue.replace(`[[${token}]]`, `![](${data.signature})\n${data.name}`));
      },
      error: () => {
        pendingSignatures.push(token);
      }
    });
  };
  
  const smde = new SimpleMDE({ 
    element: $("#content-editor")[0],
    spellChecker: false,
    toolbar: [
      "bold",
      "italic",
      "heading",
      "|",
      "quote",
      "unordered-list",
      "ordered-list",
      "|",
      "link",
      "image",
      "preview",
      "side-by-side",
      "fullscreen",
      "|",
      "guide",
      "|",
      {
        name: "encrypt",
        action: (editor) => {
          const selections = editor.codemirror.doc.getSelections();
          if (!selections[0] || selections[0].length < 1) {
            return;
          }

          const encryptPromises = [];
          selections.forEach((selection) => {
            encryptPromises.push(getEncryptedOrDecryptedText(selection, true));
          });
          
          Promise.all(encryptPromises).then((encryptedTexts) => {
            editor.codemirror.doc.replaceSelections(encryptedTexts);
          });
        },
        className: "fa fa-lock",
        title: "Encrypt selected data"
      }, {
        name: "decrypt",
        action: (editor) => {
          const selection = editor.codemirror.doc.getSelection();
          if (!selection) {
            return;
          }

          const element = $(selection);
          if (element.attr('type') !== 'redacted-text') {
            return;
          }
          
          getEncryptedOrDecryptedText(element.text(), false)
            .then((decrypted) => {
              editor.codemirror.doc.replaceSelection(decrypted);
            });
        },
        className: "fa fa-unlock",
        title: "Decrypt selected data"
      }, 
      "|",
      {
        name: "reqsignature",
        action: (editor) => {
          $.getJSON('/slack/users', (users) => {
            const adminUsers = [];
            users.forEach((user) => {
              if (user.is_admin) {
                adminUsers.push({
                  text: user.real_name,
                  value: JSON.stringify({id: user.id, name: user.real_name})
                });
              }
            });
            bootbox.prompt({
                title: "Pyydä allekirjoitusta",
                inputType: 'select',
                inputOptions: adminUsers,
                callback: (result) => {
                  if (result) {
                    const userData = JSON.parse(result);
                    $.post('/signature/create', userData, (response) => {
                      const pos = editor.codemirror.doc.getCursor();
                      editor.codemirror.doc.replaceRange(`[[${response.token}]]`, pos);
                      pendingSignatures.push(response.token);
                    });
                  }
                }
            });
          });
        },
        className: "fa fa-pencil",
        title: "Request signature"
      } 
    ],
    previewRender: (plainText, preview) => {

      setTimeout(() => {
        const encryptedElements = $(preview).find('object[type="redacted-text"]');
        const decryptPromises = [];
        encryptedElements.each((index, element) => {
          decryptPromises.push(getEncryptedOrDecryptedText($(element).text(), false));
        });
        
        Promise.all(decryptPromises).then((decryptedTexts) => {
          encryptedElements.each((index, element) => {
            $(element).attr('type', 'decrypted-text');
            $(element).html(smde.markdown(decryptedTexts[index]));
          });
        });
      }, 1);

      return smde.markdown(plainText);
    }
  });
  
  $('#commitBtn').click(() => {
    const data = {
      filename: $('#fileNameInput').val(),
      message: $('#commitMessageInput').val(),
      content: smde.value()
    };
    
    $.post('/gh/file', data, (res) => {
      updateIssues();
    });
  });
  
  $(document).on('click', '.issue', (e) => {
    $(e.target)
      .closest('.issue')
      .toggleClass('list-group-item-info')
      .toggleClass('selected');
    
    updateDocument();
  });
  
  $(document).ready(() => {
    const date = moment().format('YYYY-MM-DD');
    $('#fileNameInput').val(`${date}-hallitus.md`);
    updateIssues();
  });

  setInterval(() => {
    if (pendingSignatures.length > 0) {
      checkSignature(pendingSignatures.shift());
    }
  }, 2000);

})();
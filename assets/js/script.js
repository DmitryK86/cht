$(function(){

    // Storing some elements in variables for a cleaner code base

    var refreshButton = $('#refresh'),
        form = $('#shoutbox-form'),
        nameElement = form.find('#shoutbox-name'),
        replyTextElem = form.find('#reply-text'),
        commentElement = form.find('#shoutbox-comment'),
        imageElement = form.find('#image'),
        submitBtn = form.find('#submit-btn'),
        messagesBlock = $('#messages-block'),
        userName = getUserName(),
        canLoad = true;


    // Replace :) with emoji icons:
    emojione.ascii = true;

    if (userName === undefined){
        $.when(setName(nameElement)).then(function (){load(true)});
    } else {
        nameElement.val(userName);
        load(true);
    }
    
    // On form submit, if everything is filled in, publish the shout to the database
    
    var canPostComment = true;

    form.submit(function(e){
        e.preventDefault();
        
        var name = nameElement.val().trim();
        var comment = commentElement.val().trim();
        var image = imageElement.val();

        if(name.length && (comment.length || image.length)) {
            publish(this);
        }

    });
    
    // Clicking on the REPLY button writes the name of the person you want to reply to into the textbox.

    messagesBlock.on('click', '#comment-reply', function(e){
        var replyText = $(this).data('text');

        replyTextElem.val('@'+replyText);
        commentElement.val('@'+replyText+'\r\n').focus();
    });
    
    // Clicking the refresh button will force the load function
    
    var canReload = true;

    refreshButton.click(function(){

        if(!canReload) return false;
        
        load();
        canReload = false;

        // Allow additional reloads after 2 seconds
        setTimeout(function(){
            canReload = true;
        }, 2000);
    });

    // Automatically refresh the shouts every 5 seconds
    setInterval(load,4000);


    // Store the shout in the database
    
    function publish(formObject){
        submitBtn.attr('disabled', true);

        $.ajax( {
            url: 'publish.php',
            type: 'POST',
            data: new FormData( formObject ),
            processData: false,
            contentType: false,
            success: function(data){
                commentElement.val("");
                replyTextElem.val("");
                imageElement.val('');
                load();
                submitBtn.attr('disabled', false);
            }
        } );
    }
    
    // Fetch the latest shouts
    function load(forceScroll){
        if (!getUserName()){
            return;
        }
        if (!canLoad){
            return;
        }
        canLoad = false;
        $.getJSON('./load.php', function(data) {
            appendComments(data, forceScroll);
            canLoad = true;
        });
    }
    
    // Render an array of shouts as HTML
    
    function appendComments(data, forceScroll) {
        var id = $('#messages-block .container').last().data('id');

        var needScrollDown = forceScroll || (id && id !== data[0].id);

        var messages = [];
        data.forEach(function(d){
            let nameElem = document.createElement('div'),
                timeElem = document.createElement('div'),
                nameTimeElem = document.createElement('div'),
                textElem = document.createElement('p'),
                replyBtn = document.createElement('small'),
                elem = document.createElement('div'),
                online = document.createElement('div');

            nameElem.className = 'col-2';
            nameElem.innerHTML = '<h6 class="mb-1" style="color: red">' + d.name + '</h6>';

            online.className = 'col-5';
            let badgeClass = 'secondary',
                badgeText = 'Offline';
            if (d.isOnline){
                badgeClass = 'success';
                badgeText = 'Online';
            }
            online.innerHTML = '<span class="badge bg-'+badgeClass+'">' + badgeText + '</span>';

            timeElem.className = 'col-5';
            timeElem.setAttribute("style", "text-align:right;");
            timeElem.innerText = d.timeAgo;

            nameTimeElem.className = 'row justify-content-between';
            nameTimeElem.prepend(timeElem);
            nameTimeElem.prepend(online);
            nameTimeElem.prepend(nameElem);

            textElem.className = 'mb-1';
            textElem.innerHTML = emojione.toImage(d.text);

            replyBtn.innerHTML = '<a data-text="'+ cutText(d.text) +'" href="#" id="comment-reply">REPLAY</a>';

            elem.className = 'container list-group-item ' + getMessageClass(d.name);
            elem.setAttribute('data-id', d.id);
            elem.prepend(replyBtn);
            elem.prepend(textElem);
            if (d.replyText && d.replyText.length){
                let reply = document.createElement('div');
                reply.style.marginBottom = '10px';
                reply.innerHTML = '<small style="background: #8ae479;padding: 8px;border-radius: 5px;">'+d.replyText+'</small>';
                elem.prepend(reply);
            }
            if (d.imgSrc && d.imgSrc.length){
                let imgElem = document.createElement('img');
                imgElem.className = 'img-fluid';
                imgElem.src = d.imgSrc;
                elem.prepend(imgElem);
            }
            elem.prepend(nameTimeElem);

            messages.unshift(elem);
        });

        messagesBlock.empty();
        messagesBlock.append(messages);

        if (needScrollDown){
            $('#overflow-block').scrollTop(messagesBlock.height());
        }
    }

    function getMessageClass(uname){
        if (getCookie('_uname') == uname){
            return 'list-group-item-warning';
        }
        return '';
    }

    function cutText(text){
        if (text.length <= 20){
            return text;
        }

        return text.slice(0, 20) + '...';
    }

    function getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    async function setName(nameElement){
        await Swal.fire({
            title: 'Enter username',
            input: 'text',
            inputAttributes: {
                autocapitalize: 'off'
            },
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to write something!'
                }
            },
            preConfirm: (name) => {
                return fetch(`/setName.php?name=${name}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.message)
                        }
                        nameElement.val(name);
                    })
                    .catch(error => {
                        Swal.showValidationMessage(
                            `Request failed: ${error}`
                        )
                    })
            },
        });
    }

    function getUserName(){
        return getCookie('_uname');
    }

});
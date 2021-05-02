$(function(){

    // Storing some elements in variables for a cleaner code base

    var refreshButton = $('#refresh'),
        form = $('#shoutbox-form'),
        nameElement = form.find('#shoutbox-name'),
        replyTextElem = form.find('#reply-text'),
        commentElement = form.find('#shoutbox-comment'),
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

    $('#overflow-block').scrollTop(messagesBlock.height());
    
    // On form submit, if everything is filled in, publish the shout to the database
    
    var canPostComment = true;

    form.submit(function(e){
        e.preventDefault();
        
        var name = nameElement.val().trim();
        var comment = commentElement.val().trim();
        var reply = replyTextElem.val();

        if(name.length && comment.length && comment.length < 240) {
            publish(name, comment, reply);
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
    setInterval(load,5000);


    // Store the shout in the database
    
    function publish(name,comment, reply){
        submitBtn.attr('disabled', true);
        $.post('publish.php', {name: name, comment: comment, reply: reply}, function(){
            commentElement.val("");
            replyTextElem.val("");
            load();
            submitBtn.attr('disabled', false);
        });
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

        messagesBlock.empty();
        data.forEach(function(d){
            let nameElem = document.createElement('div'),
                timeElem = document.createElement('div'),
                nameTimeElem = document.createElement('div'),
                textElem = document.createElement('p'),
                replyBtn = document.createElement('small'),
                elem = document.createElement('div');

            nameElem.className = 'col-7';
            nameElem.innerHTML = '<h6 class="mb-1" style="color: red">' + d.name + '</h6>';

            timeElem.className = 'col-5';
            timeElem.setAttribute("style", "text-align:right;");
            timeElem.innerText = d.timeAgo;

            nameTimeElem.className = 'row justify-content-between';
            nameTimeElem.prepend(timeElem);
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
            elem.prepend(nameTimeElem);

            messagesBlock.prepend(elem);
        });

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
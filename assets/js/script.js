$(function(){

    // Storing some elements in variables for a cleaner code base

    var refreshButton = $('#refresh'),
        form = $('#shoutbox-form'),
        nameElement = form.find('#shoutbox-name'),
        commentElement = form.find('#shoutbox-comment'),
        messagesBlock = $('#messages-block');


    // Replace :) with emoji icons:
    emojione.ascii = true;

    // Load the comments.
    load();

    let userName = getCookie('_uname');
    if (userName === undefined){
        setName(nameElement);
    } else {
        nameElement.val(userName);
    }
    
    // On form submit, if everything is filled in, publish the shout to the database
    
    var canPostComment = true;

    form.submit(function(e){
        e.preventDefault();

        if(!canPostComment) return;
        
        var name = nameElement.val().trim();
        var comment = commentElement.val().trim();

        if(name.length && comment.length && comment.length < 240) {

            publish(name, comment);

            // Prevent new shouts from being published

            canPostComment = false;

            // Allow a new comment to be posted after 5 seconds

            setTimeout(function(){
                canPostComment = true;
            }, 5000);

        }

    });
    
    // Clicking on the REPLY button writes the name of the person you want to reply to into the textbox.

    messagesBlock.on('click', '#comment-reply', function(e){
        var replyText = $(this).data('text');

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
    //setInterval(load,5000);


    // Store the shout in the database
    
    function publish(name,comment){
        $.post('publish.php', {name: name, comment: comment}, function(){
            commentElement.val("");
            load();
        });
    }
    
    // Fetch the latest shouts
    
    function load(){
        $.getJSON('./load.php', function(data) {
            appendComments(data);
        });
    }
    
    // Render an array of shouts as HTML
    
    function appendComments(data) {

        messagesBlock.empty();

        data.forEach(function(d){
            let elem = document.createElement('div');
            elem.className = 'container list-group-item ' + getMessageClass(d.name);
            elem.innerHTML = '<div class="row justify-content-between">' +
                '<div class="col-7"><h6 className="mb-1" style="color: red">' + d.name + '</h6></div>'+
                '<div class="col-5" style="text-align: right;"><small>' + d.timeAgo + '</small></div>'+
            '</div>'+
            '<p className="mb-1">' + emojione.toImage(d.text) + '</p>'+
            '<small><a data-text="'+ cutText(d.text) +'" href="#" id="comment-reply">REPLAY</a></small>';
            messagesBlock.append(elem);
        });

        //$('#messages-block').scrollHeight = 1000

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

});
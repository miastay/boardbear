jQuery.easing.def = "easeInOutCirc"; 
//$("#join_sub").slideToggle(); //$("#pop").remove(); socketStart()

//window.onload = () => {

    const State = {
        'showJoin': 0,
        'showCreate': 1,
        'hideJoin': 2,
        'hideCreate': 3,
        'showJoinEnter': 4,
        'showJoinFail': 5,
        'hideJoinEnter': 6,
        'hideAll': 10,
        'none': -1
    }
    var lastState = State.none;
    
    var elems = {
        'root': $("#pop"),
        'join': {
            'button': $("#join_button"),
            'sub': $("#join_sub"),
            'back': $("#join_back"),
            'enter': $("#join_enter"),
            'all': $("#L_join").find("*")
        },
        'create': {
            'button': $("#create_button"),
            'sub': $("#create_sub"),
            'back': $("#create_back"),
            'enter': $("#create_enter"),
            'all': $("#L_create").find("*")
        }
    }
    const hideJoins = () => {
        elems.join.all.slideDown();
    }
    const hideCreates = () => {
        elems.create.all.slideDown();
    }
    const hideFront = () => {
        elems.create.button.slideUp();
        elems.join.button.slideUp();
    }
    const showFront = () => {
        elems.create.button.slideDown();
        elems.join.button.slideDown();
    }
        /*
        
        $("#create_button"),
        $("#create_sub"),
    ]*/
    
    var setState = (state) => {
        switch(state) {
            case State.showJoin: {
                hideFront();
                elems.join.sub.slideDown();
                elems.join.back.slideDown();
                break;
            }
            case State.hideJoin: {
                elems.join.sub.slideUp();
                elems.join.back.slideUp();
                showFront();
                break;
            }
            case State.showCreate: {
                hideFront();
                elems.create.sub.slideDown();
                elems.create.enter.text(`create board`);
                elems.create.back.slideDown();
                break;
            }
            case State.hideCreate: {
                elems.create.sub.slideUp();
                elems.create.back.slideUp();
                showFront();
                break;
            }
            case State.showJoinEnter: {
                elems.join.sub.addClass('good');
                elems.join.enter.text(`join "${board.name}"`);
                elems.join.enter.slideDown();
                elems.join.enter.focus();
                break;
            }
            case State.showJoinFail: {
                elems.join.sub.addClass('bad');
                elems.join.enter.addClass('x');
                elems.join.enter.text(`couldn't find ${code.join("")}`);
                elems.join.enter.slideDown();
                break;
            }
            case State.hideJoinEnter: {
                elems.join.sub.removeClass('good');
                elems.join.sub.removeClass('bad');
                elems.join.enter.removeClass('x');
                elems.join.enter.slideUp();
                break;
            }
            case State.hideAll: {
                elems.root.slideUp();
            }
            case State.none:
            default:
                {
                }
        }   
        lastState = state; 
    }
    
    
    //$("#L_inner").find("*").slideToggle(); 
    elems.join.button.on('click', (event) => {
        setState(State.showJoin);
    });
    elems.join.back.on('click', (event) => {
        setState(State.hideJoin);
    });
    elems.join.enter.on('click', (event) => {
        //join board here
        if(lastState == State.showJoinEnter) {
            joinBoard(board, function() {
                setTimeout(function(){setState(State.hideAll); document.resetZoom();}, 0);
            })
        } else {
            clearCode();
        }
        
    });
    elems.create.button.on('click', (event) => {
        setState(State.showCreate);
    });
    elems.create.enter.on('click', (event) => {
        tryCreate({'name': 'noname'}, function(response) {
            console.log(response);
        })
    });
    elems.create.back.on('click', (event) => {
        setState(State.hideCreate);
    });
    var code = []; var board = null;
    $("#join_sub_code").find("*").on('input focus keydown', (event) => {
        const e = $(event.target);
        const i = $(event.target)[0].id.substring(3);
        if(board) {
            clearCode();
        }
        switch(event.type) {
            case 'input': {
                e[0].value = Number.parseInt(e[0].valueAsNumber%10);
                code[i] = e[0].value;
                if(e.next().length > 0) {
                    e.next().focus();
                } else if($("#join_sub_code").find("*")[0].value == '') {
                    $("#join_sub_code").find("*")[0].focus();
                } else {
                    $(event.target).blur();
                    tryCode(code.join(''), function(result) {
                        board = result.board;
                        if(result.board) {
                            setState(State.showJoinEnter);
                        } else {
                            setState(State.showJoinFail);
                            //board = null; 
                            //code = []; 
                            //[...$("#join_sub_code").find("*")].forEach(x => x.value = '')
                        }
                    });
                }
            }
                break;
            case 'keydown': {
                console.log(event)
                if(event.originalEvent.key === 'Backspace') {
                    e.prev().focus();
                }
                if(event.originalEvent.key === 'Enter') {
                    $(event.target).blur();
                    tryCode(code.join(''), function(result) {
                        board = result.board;
                        if(result.board) {
                            setState(State.showJoinEnter);
                        } else {
                            setState(State.showJoinFail);
                            //board = null; 
                            //code = []; 
                            //[...$("#join_sub_code").find("*")].forEach(x => x.value = '')
                        }
                    });
                }
            }   break;
            case 'focus':
                //e[0].value = '';
                break;
        }
    });
    const renderCode = (ecode) => {
        [...$("#join_sub_code").find("*")].forEach(x => { x.value = ecode[x.id.substring(3)]; code[x.id.substring(3)] = ecode[x.id.substring(3)] } );
    }
    const clearCode = () => {
        board = null;
        code = [];
        [...$("#join_sub_code").find("*")].forEach(x => x.value = '')
        setState(State.hideJoinEnter);
    }

/*
joinBoard({'port': 8091}, function() {
    setTimeout(function(){setState(State.hideAll); document.resetZoom();}, 0);
})
*/

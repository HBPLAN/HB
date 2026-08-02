
window.HB = window.HB || {};
HB.LOGIN_USERS_KEY = 'hbplanner_local_users';
HB.LOGIN_SESSION_KEY = 'hbplanner_login_session';

HB.storage = {
  currentUser(){
    try{
      const session = JSON.parse(
        sessionStorage.getItem(HB.LOGIN_SESSION_KEY) ||
        localStorage.getItem(HB.LOGIN_SESSION_KEY) ||
        'null'
      );
      return session && session.user ? session.user : null;
    }catch{
      return null;
    }
  },

  dataKey(user){
    return `hbplanner_professional_v1_${String(user).toLowerCase()}`;
  },

  load(){
    const user = HB.storage.currentUser();
    if(!user) return null;

    try{
      const raw = localStorage.getItem(HB.storage.dataKey(user));
      return raw ? JSON.parse(raw) : null;
    }catch{
      return null;
    }
  },

  save(data){
    const user = HB.storage.currentUser();
    if(!user) return;
    localStorage.setItem(HB.storage.dataKey(user), JSON.stringify(data));
  },

  getUsers(){
    try{
      return JSON.parse(localStorage.getItem(HB.LOGIN_USERS_KEY) || '{}');
    }catch{
      return {};
    }
  },

  saveUsers(users){
    localStorage.setItem(HB.LOGIN_USERS_KEY, JSON.stringify(users));
  },

  login(user, password, remember){
    const cleanUser = String(user || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if(!cleanUser || !cleanPassword){
      return {ok:false, message:'아이디와 비밀번호를 입력하세요.'};
    }

    const users = HB.storage.getUsers();

    if(users[cleanUser]){
      if(users[cleanUser].password !== cleanPassword){
        return {ok:false, message:'비밀번호가 맞지 않습니다.'};
      }
    }else{
      users[cleanUser] = {
        password: cleanPassword,
        createdAt: new Date().toISOString()
      };
      HB.storage.saveUsers(users);
    }

    const session = JSON.stringify({user:cleanUser});

    localStorage.removeItem(HB.LOGIN_SESSION_KEY);
    sessionStorage.removeItem(HB.LOGIN_SESSION_KEY);

    if(remember){
      localStorage.setItem(HB.LOGIN_SESSION_KEY, session);
    }else{
      sessionStorage.setItem(HB.LOGIN_SESSION_KEY, session);
    }

    return {ok:true, user:cleanUser};
  },

  logout(){
    localStorage.removeItem(HB.LOGIN_SESSION_KEY);
    sessionStorage.removeItem(HB.LOGIN_SESSION_KEY);
  }
};

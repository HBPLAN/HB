window.HB = window.HB || {};

HB.LOGIN_USERS_KEY = 'hbplanner_local_users_v2';
HB.LOGIN_SESSION_KEY = 'hbplanner_login_session_v2';
HB.LAST_USER_KEY = 'hbplanner_last_user_v2';
HB.DATA_PREFIX = 'hbplanner_professional_v2_user_';

HB.storage = {
  normalizeUser(user){
    return String(user || '').trim().toLowerCase();
  },

  currentUser(){
    try{
      const persistent = localStorage.getItem(HB.LOGIN_SESSION_KEY);
      const temporary = sessionStorage.getItem(HB.LOGIN_SESSION_KEY);
      const raw = persistent || temporary;
      if(!raw) return null;

      const session = JSON.parse(raw);
      return session && session.user
        ? HB.storage.normalizeUser(session.user)
        : null;
    }catch{
      return null;
    }
  },

  lastUser(){
    return HB.storage.normalizeUser(
      localStorage.getItem(HB.LAST_USER_KEY) || ''
    );
  },

  dataKey(user){
    return HB.DATA_PREFIX + HB.storage.normalizeUser(user);
  },

  legacyDataKeys(user){
    const clean = HB.storage.normalizeUser(user);
    return [
      `hbplanner_professional_v1_${clean}`,
      'hbplanner_professional_v1'
    ];
  },

  load(){
    const user = HB.storage.currentUser();
    if(!user) return null;

    const currentKey = HB.storage.dataKey(user);

    try{
      const current = localStorage.getItem(currentKey);
      if(current) return JSON.parse(current);

      // 이전 버전 데이터가 있으면 새 사용자 저장소로 1회 이전
      for(const legacyKey of HB.storage.legacyDataKeys(user)){
        const legacy = localStorage.getItem(legacyKey);
        if(!legacy) continue;

        const parsed = JSON.parse(legacy);
        localStorage.setItem(currentKey, JSON.stringify(parsed));
        return parsed;
      }
    }catch(error){
      console.error('데이터 불러오기 실패:', error);
    }

    return null;
  },

  save(data){
    const user = HB.storage.currentUser();
    if(!user || !data) return false;

    try{
      const serialized = JSON.stringify(data);
      localStorage.setItem(HB.storage.dataKey(user), serialized);

      // 실제 저장 여부 재확인
      return localStorage.getItem(HB.storage.dataKey(user)) === serialized;
    }catch(error){
      console.error('데이터 저장 실패:', error);
      return false;
    }
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
    const cleanUser = HB.storage.normalizeUser(user);
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

    const session = JSON.stringify({
      user:cleanUser,
      loginAt:new Date().toISOString()
    });

    localStorage.removeItem(HB.LOGIN_SESSION_KEY);
    sessionStorage.removeItem(HB.LOGIN_SESSION_KEY);

    if(remember){
      localStorage.setItem(HB.LOGIN_SESSION_KEY, session);
    }else{
      sessionStorage.setItem(HB.LOGIN_SESSION_KEY, session);
    }

    localStorage.setItem(HB.LAST_USER_KEY, cleanUser);
    return {ok:true, user:cleanUser};
  },

  logout(){
    localStorage.removeItem(HB.LOGIN_SESSION_KEY);
    sessionStorage.removeItem(HB.LOGIN_SESSION_KEY);
  }
};

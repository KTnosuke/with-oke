// =================================
// Withオケ データ管理
// =================================

let data = JSON.parse(
    localStorage.getItem("withOkeData")
) || {
    people: [],
    freeSongs: []
};

let currentPerson = null;
let currentMode = "home";

let currentSong = null;

// データ保存
function saveData() {
    localStorage.setItem(
        "withOkeData",
        JSON.stringify(data)
    );
}

// 日付取得
function today() {
    return new Date().toLocaleDateString("ja-JP");
}

// ID作成
function createId() {
    return Date.now().toString() +
        Math.random().toString(36).slice(2);
}

// =================================
// トップ画面
// =================================

function showHome() {

    currentMode = "home";

    document.getElementById("home").hidden = false;
    document.getElementById("songs-view").hidden = true;

    const list = document.getElementById("people-list");

    list.innerHTML = "";

    if (data.people.length === 0) {
        list.innerHTML =
            '<div class="empty-message">まだ登録がありません。<br>一緒に行く人を追加してね！</div>';
    }

    data.people.forEach(person => {

        const card = document.createElement("div");

        card.className = "person-card";

        card.innerHTML = `
            <span class="person-name">${escapeHTML(person.name)}</span>
            <span class="person-count">
                ${person.songs.length}曲 →
            </span>
        `;

        card.onclick = () => showSongs(person.id);

        list.appendChild(card);
    });
}

// =================================
// 人の追加
// =================================

document.getElementById("add-person").onclick = () => {

    const name = prompt("一緒に行く人の名前を入力してね");

    if (!name || !name.trim()) return;

    data.people.push({
        id: createId(),
        name: name.trim(),
        songs: []
    });

    saveData();
    showHome();
};

// =================================
// 曲一覧表示
// =================================

function showSongs(personId = null) {

    currentPerson = personId;

    currentMode = personId ? "person" : "free";

    document.getElementById("home").hidden = true;
    document.getElementById("songs-view").hidden = false;

    const title = document.getElementById("list-title");

    if (personId) {

        const person = data.people.find(p => p.id === personId);

        title.textContent = "🎤 " + person.name + " の曲";

        document.getElementById("delete-person").hidden = false;

    } else {

        title.textContent = "🎵 フリー曲";

        document.getElementById("delete-person").hidden = true;
    }

    renderSongs();
}

// =================================
// 曲一覧・曲詳細の表示
// =================================

function renderSongs() {

    const list = document.getElementById("songs-list");
    const addButton = document.getElementById("add-song");

    list.innerHTML = "";

    const songs = currentMode === "free"
        ? data.freeSongs
        : data.people.find(p => p.id === currentPerson).songs;

    // 詳細画面
    if (currentSong !== null) {

        const song = songs.find(s => s.id === currentSong);

        if (!song) {
            currentSong = null;
            renderSongs();
            return;
        }

        addButton.hidden = true;

        const card = document.createElement("div");
        card.className = "song-card";

        card.innerHTML = `
            <div class="song-title">
                ${song.popular.length > 0 ? "⭐ " : ""}${escapeHTML(song.title)}
            </div>

            <div class="song-artist">
                ${escapeHTML(song.artist || "アーティスト未入力")}
            </div>

            <div class="song-info">
                ${song.key ? "キー：" + escapeHTML(song.key) + "<br>" : ""}
                ${song.memo ? "メモ：" + escapeHTML(song.memo) : ""}
            </div>

            <div class="song-stats">
                🎤 歌った回数：${song.sung.length}回
                ${song.sung.length
                    ? "<br>歌った日：" + song.sung.join("、")
                    : ""}
            </div>

            <div class="song-actions">
                <button class="sung-button">🎤 歌った！</button>
                <button class="popular-button">⭐ 好評だった！</button>
                <button class="edit-button">✏️ 編集</button>
                <button class="delete-button">🗑 削除</button>
            </div>
        `;

        const buttons = card.querySelectorAll("button");

        buttons[0].onclick = () => {
            song.sung.push(today());
            saveData();
            renderSongs();
        };

        buttons[1].onclick = () => {
            song.popular.push(today());
            saveData();
            renderSongs();
        };

        buttons[2].onclick = () => editSong(song);

        buttons[3].onclick = () => {
            if (!confirm("この曲を削除する？")) return;
            removeSong(song.id);
            currentSong = null;
        };

        list.appendChild(card);
        return;
    }

    // 曲一覧画面
    addButton.hidden = false;

    if (songs.length === 0) {
        list.innerHTML =
            '<div class="empty-message">まだ曲がありません。<br>＋曲を追加してね！</div>';
    }

    songs.forEach(song => {

        const card = document.createElement("div");
        card.className = "person-card song-list-item";

        card.innerHTML = `
            <span class="person-name">
                ${song.popular.length > 0 ? "⭐ " : ""}${escapeHTML(song.title)}
            </span>
            <span>›</span>
        `;

        card.onclick = () => {
            currentSong = song.id;
            renderSongs();
        };

        list.appendChild(card);
    });
}

// =================================
// 曲の追加
// =================================

document.getElementById("add-song").onclick = () => {

    const title = prompt("曲名を入力してね");

    if (!title || !title.trim()) return;

    const artist = prompt("アーティスト名") || "";
    const key = prompt("キー設定（例：原曲、-2、+1）") || "";
    const memo = prompt("メモ（歌い出し、注意点など）") || "";

    const song = {
        id: createId(),
        title: title.trim(),
        artist: artist.trim(),
        key: key.trim(),
        memo: memo.trim(),
        sung: [],
        popular: []
    };

    if (currentMode === "free") {

        data.freeSongs.push(song);

    } else {

        const person = data.people.find(p => p.id === currentPerson);

        person.songs.push(song);
    }

    saveData();
    renderSongs();
};

// =================================
// 曲の編集
// =================================

function editSong(song) {

    const title = prompt("曲名", song.title);

    if (!title || !title.trim()) return;

    const artist = prompt("アーティスト名", song.artist);
    const key = prompt("キー設定", song.key);
    const memo = prompt("メモ", song.memo);

    song.title = title.trim();
    song.artist = (artist || "").trim();
    song.key = (key || "").trim();
    song.memo = (memo || "").trim();

    saveData();
    renderSongs();
}

// =================================
// 曲の削除
// =================================

function removeSong(songId) {

    if (currentMode === "free") {

        data.freeSongs = data.freeSongs.filter(
            s => s.id !== songId
        );

    } else {

        const person = data.people.find(p => p.id === currentPerson);

        person.songs = person.songs.filter(
            s => s.id !== songId
        );
    }

    saveData();
    renderSongs();
}

// =================================
// 人の削除
// =================================

document.getElementById("delete-person").onclick = () => {

    if (!confirm("この人と登録した曲をすべて削除する？")) return;

    data.people = data.people.filter(
        p => p.id !== currentPerson
    );

    saveData();
    showHome();
};

// =================================
// フリー曲
// =================================

document.getElementById("free-songs").onclick = () => {
    showSongs(null);
};

// =================================
// 戻る
// =================================

document.getElementById("back-button").onclick = () => {
    showHome();
};

// =================================
// HTML表示用の文字処理
// =================================

function escapeHTML(text) {

    return String(text).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);

}

// =================================
// 起動
// =================================

showHome();
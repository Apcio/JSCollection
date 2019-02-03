class myBook {
    constructor(title, author, isbn) {
        this.validated = false;
        this.title = {value: title, valid: false};
        this.author = {value: author, valid: false};
        this.isbn = {value: isbn, valid: false, inCollection: false};
    }

    validate(storage) {
        var isGood = true;
        var patt = new RegExp("^(\D|[^\d%]+)$");

        this.validated = true;

        this.title.valid = true;
        if (this.title.value == '') {
            this.title.valid = false;
            isGood = false;
        }

        this.author.valid = true;
        if (this.author.value == '') {
            this.author.valid = false;
            isGood = false;
        }
        if (patt.test(this.author.value) == false) {
            this.author.valid = false;
            isGood = false;
        }

        this.isbn.valid = true;
        if (this.isbn.value == '') {
            this.isbn.valid = false;
            isGood = false;
        }
        if (/^\d*$/gm.test(this.isbn.value) == false) {
            this.isbn.valid = false;
            isGood = false;
        }

        if (storage && storage !== null && storage instanceof myStorage === true) {
            if (storage.isbnExists(this.isbn.value) == true) {
                this.isbn.valid = false;
                this.isbn.inCollection = true;
                isGood = false;
            }
        }

        return isGood;
    }
}

class myStorage {
    constructor() {
        this.storageArray = [];
    }

    isBookType(book) {
        if (!book || book === null || typeof(book) !== 'object' || book instanceof myBook !== true) {
            return false;
        }
        return true;
    }

    addItem(book) {
        if (this.isBookType(book) == false) {
            return false;
        }
        this.storageArray.push(book);
        return true;
    }

    removeItem(book) {
        if (this.isBookType(book) == false) {
            return false;
        }

        this.storageArray.forEach( (b, index) => {
            if (b.isbn === book.isbn && b.author == book.author && b.title == book.title) {
                this.storageArray.splice(index, 1);
            }
        });

        return true;
    }

    getItems() {
        return this.storageArray;
    }

    saveItems() {
        localStorage.setItem('myBookCollection', JSON.stringify(this.storageArray));
    }

    loadItems() {
        let items = localStorage.getItem('myBookCollection');
        let book;
        try {
            items = JSON.parse(items);
            if (items && items !== null && Array.isArray(items) === true) {
                items.forEach(b => {
                    book = new myBook(b.title.value, b.author.value, b.isbn.value);
                    if (book.validate()) {
                        this.addItem(book);
                    }
                });
            }
            return true;
        } catch(err) {
            return false;
        }
    }

    isbnExists(val) {
        let result = false;

        //metoda forEach będzie wykonywała się dla wszystkich elementów, więc nie da się ją
        //wyłączyć przy pierwszym znalezionym elemencie
        //metoda every testuje wszystkie elementy, ale zatrzymuje się na pierwszym, który nie
        //przeszedł testu
        this.storageArray.every((elem) => {
            if (elem.isbn.value == val) {
                result = true;
                return false;
            }
            return true;
        });
        return result;
    }

    getBookByISBN(val) {
        let result = null;

        this.storageArray.every((elem) => {
            if (elem.isbn.value == val) {
                result = elem;
                return false;
            }
            return true;
        });
        return result;
    }
}

class myUI {
    constructor() {
        this.storage = new myStorage();
        this.storage.loadItems();
    }

    static UI() {
        if (!this.instance || this.instance === null || this.instance instanceof myUI !== true) {
            this.instance = new myUI();
        }

        return this.instance;
    }

    static showItems() {
        let rows = '';
        this.UI().storage.getItems().forEach( (b, index) => {
            rows = rows + "\n" +
                '<tr>' + "\n\t" +
                    '<td scope="col">' + (index + 1) + '</td>' + "\n\t" +
                    '<td scope="col">' + b.author.value + '</td>' + "\n\t" +
                    '<td scope="col">' + b.title.value + '</td>' + "\n\t" +
                    '<td scope="col">' + b.isbn.value + '</td>' + "\n" +
                    '<td scope="col"><button type="button" id="RemoveButton" ' +
                                      'class="btn btn-danger" value="' + b.isbn.value +
                                      '" data-toggle="tooltip">X</button></td>' + "\n" +
                '</tr>';
        });
        let table = document.getElementById('BookListTable').querySelector('tbody');
        table.innerHTML = rows;

        if (rows !== '') {
            document.querySelectorAll('#RemoveButton').forEach((e) => {
                e.addEventListener('click', myUI.confirmDelete);
            });
        }
    }

    static confirmDelete(event) {
        let book = myUI.UI().storage.getBookByISBN(this.value);
        if (!book) {
            alert('Nie znaleziono kolekcji');
            return;
        }

        if (confirm('Czy chcesz usunąć pozycję?' + "\n" +
                book.author.value + "\n" +
                book.title.value + "\n" +
                book.isbn.value + "\n") == true) {
                    myUI.UI().storage.removeItem(book);
                    myUI.UI().storage.saveItems();
                    myUI.showItems();
        }
    }

    static clearForm() {
        let elem = document.querySelector('#inTytul');
        elem.classList.remove("is-valid", "is-invalid");
        elem.value = "";

        elem = document.querySelector('#inAutor');
        elem.classList.remove("is-valid", "is-invalid");
        elem.value = "";

        elem = document.querySelector('#inISBN');
        elem.classList.remove("is-valid", "is-invalid");
        elem.value = "";

        elem = document.querySelector('#isbnInvalid');
        elem.classList.add("d-none");

        elem = document.querySelector('#isbnExisted');
        elem.classList.add("d-none");
    }
}

document.addEventListener('DOMContentLoaded', function(event) {
    myUI.showItems();
});

document.querySelector('#collection-form').addEventListener('submit', (e) => {
    e.preventDefault(); //aby nie wykonywać domyślego eventu submita
    let title = document.querySelector('#inTytul');
    let author = document.querySelector('#inAutor');
    let isbn = document.querySelector('#inISBN');

    let book = new myBook(title.value, author.value, isbn.value);
    let canAdd = book.validate(myUI.UI().storage);

    if (canAdd == true) {
        myUI.UI().storage.addItem(book);
        myUI.showItems();
        myUI.UI().storage.saveItems();
        myUI.clearForm();
    }

    if (canAdd == false) {
        title.classList.remove("is-valid", "is-invalid");
        if (book.title.valid == true) {
            title.classList.add("is-valid");
        } else {
            title.classList.add("is-invalid");
        }

        author.classList.remove("is-valid", "is-invalid");
        if (book.author.valid == true) {
            author.classList.add("is-valid");
        } else {
            author.classList.add("is-invalid");
        }

        isbn.classList.remove("is-valid", "is-invalid");
        if (book.isbn.valid == true) {
            isbn.classList.add("is-valid");
        } else {
            if (book.isbn.inCollection == true) {
                document.querySelector('#isbnExisted').classList.remove("d-none");
                document.querySelector('#isbnInvalid').classList.add("d-none");
            } else {
                document.querySelector('#isbnInvalid').classList.remove("d-none");
                document.querySelector('#isbnExisted').classList.add("d-none");
            }
            isbn.classList.add("is-invalid");
        }
    }
});

$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});
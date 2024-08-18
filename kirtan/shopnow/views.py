from django.shortcuts import render, redirect,HttpResponse
from django.contrib.auth.models import User 
from django.contrib.auth import authenticate, login, logout
from shopnow.models import Contact
from django.contrib.auth.decorators import login_required

# Create your views here.


def index(request):
    if request.user.is_anonymous:
        return redirect("/login")
    return render(request, 'index.html')
    return HttpResponse("This is a homepage")

def loginUser(request):
    if request.user.is_authenticated:
        return redirect("/")
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            # A backend authenticated the credentials
            return redirect("/")
        else:
            return render(request, 'login.html')
    # No backend authenticated the credentials
    return render(request, 'login.html')

def logoutUser(request):
    logout(request)
    # Redirect to a success page.
    return redirect("/login")

def homepage(request):
    context = {
        "variable":"this is sent"
    }
    return render(request, 'index.html')

@login_required
def about(request):
    return render(request, 'about.html')
    return HttpResponse("This is a about page")

@login_required
def services(request):
    return render(request, 'services.html')
    return HttpResponse("This is a service page")


@login_required
def contact(request):
    if request.method == "POST":
        email = request.POST.get('email')
        name = request.POST.get('name')
        contact = Contact(email = email, name=name )
        contact.save()
    return render(request, 'contact.html')